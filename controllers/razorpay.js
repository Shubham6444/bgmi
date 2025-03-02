require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

// ✅ Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});
exports.createorder = async (req, res) => {
    try {
        if (!req.session.user?.email) {
            return res.status(400).json({ success: false, message: "Login agin" });
        }

        let userId = req.session.user.email;
        const { addmoney } = req.body;
        if (!userId || !addmoney || isNaN(addmoney) || addmoney <= 0) {
            return res.status(400).json({ error: 'Invalid user ID or amount' });
        }

        const amount = addmoney * 100; // Convert to paise

        const options = {
            amount,
            currency: "INR",
            receipt: `order_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        if (!order || !order.id) {
            return res.status(500).json({ error: "Order creation failed" });
        }

        // Store transaction history with 'Pending' status
        const insertHistoryQuery = `
    INSERT INTO wallet_history (email, amount, method, time, status, order_id) 
    VALUES (?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'), ?, ?)
`;

        await db.execute(insertHistoryQuery, [userId, addmoney, 'Razorpay', 'Pending', order.id]);

        res.json({
            success: true,
            message: "Order created successfully!",
            order_id: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Error in createOrder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


exports.verifypayment = async (req, res) => {
    const connection = await db.getConnection(); // Get connection from pool
    try {
        await connection.beginTransaction(); // Start the transaction

        const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing required payment details' });
        }

        if (!process.env.RAZORPAY_SECRET) {
            console.error("RAZORPAY_SECRET is missing in environment variables!");
            return res.status(500).json({ error: "Internal server error" });
        }

        // Generate the expected signature from Razorpay data
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        // Compare the generated signature with the one from Razorpay
        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Retrieve order details from wallet_history table
        const [rows] = await connection.execute(
            "SELECT email, amount, status FROM wallet_history WHERE order_id = ?",
            [razorpay_order_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'Order not found' });
        }

        const { email, amount, status } = rows[0];

        // If the status is 'Success', no need to process the payment again
        if (status === 'Success') {
            await connection.commit(); // Commit the transaction
            return res.json({ success: true, message: "Payment already verified and wallet updated", amount });
        }

        // If the user email does not match, reject the payment verification
        if (email !== userId) {
            await connection.rollback(); // Rollback the transaction in case of mismatch
            return res.status(400).json({ error: "User mismatch. Payment verification failed." });
        }

        const [existingPayment] = await connection.execute(
            "SELECT * FROM wallet_history WHERE payid = ?",
            [razorpay_payment_id]
        );

        if (existingPayment.length > 0) {
            // Payment already processed
            //  return res.json({ success: true, message: "Payment  processed" });
            return res.json({ success: true, message: "Payment verified successfully and wallet updated!", amount });
        }

        // If the payment status is 'Pending', process the payment
        if (status === 'Pending') {
            // Update the user wallet balance
            await connection.execute("UPDATE users SET addamount = addamount + ? WHERE email = ?", [amount, email]);

            // Update the wallet_history table to mark the payment as successful
            await connection.execute(
                "UPDATE wallet_history SET status = 'Success', payid = ? WHERE order_id = ?",
                [razorpay_payment_id, razorpay_order_id]
            );

            await connection.commit(); // Commit the transaction after all successful updates

            res.setHeader("x-rtb-fingerprint-id", "your-value-here"); // Optional: Set custom header for frontend

            // Send success response
            return res.json({ success: true, message: "Payment verified successfully and wallet updated!", amount });
        } else {
            await connection.rollback(); // Rollback the transaction if the payment status is not valid
            return res.status(400).json({ error: "Invalid payment status" });
        }
    } catch (error) {
        console.error("Error in verifyPayment:", error);
        await connection.rollback(); // Ensure rollback if any error occurs
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
};




exports.payment = async (req, res) => {
    const { order_id, id, base_amount, email } = req.body.payload.payment.entity;

    // Validate the incoming request payload
    if (!order_id || !id || !base_amount || !email) {
        return res.status(400).json({ error: "Invalid webhook data", data: req.body.payload.payment.entity });
    }

    try {
        // Validate Webhook authenticity by verifying the signature
        const secret = process.env.PAYMENT_PROVIDER_SECRET_KEY; // Fetch the secret key from environment variables
        if (!secret) {
            return res.status(500).json({ error: "Secret key not set in environment variables" });
        }

        // Create a hash of the incoming payload using the secret key to verify its authenticity

        const expectedSignature = req.headers['x-razorpay-signature'];
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(req.body));
        const calculatedSignature = hmac.digest('hex');

        if (calculatedSignature !== expectedSignature) {
            return res.status(400).json({ error: "Invalid signature. Webhook data could have been tampered." });
        }

        // Start a database transaction for safety
        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Retrieve order details from wallet_history to verify the payment status
        const [rows] = await connection.execute(
            "SELECT email, amount, status FROM wallet_history WHERE order_id = ? AND status = 'Pending'",
            [order_id]
        );

        // Check if the order exists in the database and is not already processed
        if (!rows || rows.length === 0) {
            await connection.rollback(); // Rollback if the order doesn't exist or is already processed
            return res.status(400).json({ error: 'Order not found or already processed' });
        }

        const { email: walletEmail, amount, status } = rows[0];

        // Prevent updating if the status is already 'Success'
        if (status === 'Success') {
            await connection.commit(); // Commit the transaction
            return res.json({ success: true, message: "Payment already verified and wallet updated", amount });
        }

        // Ensure the correct user is being credited (email validation)
        if (walletEmail !== email) {
            await connection.rollback(); // Rollback if the user emails don't match
            return res.status(400).json({ error: "User mismatch. Payment verification failed." });
        }

        const [existingPayment] = await connection.execute(
            "SELECT * FROM wallet_history WHERE payid = ?",
            [id]
        );

        if (existingPayment.length > 0) {
            // Payment already processed
            return res.json({ success: true, message: "Payment already processed" });
        }


        // Update the transaction status to 'Success' in wallet_history
        await connection.execute(
            "UPDATE wallet_history SET status = 'Success', payid = ? WHERE order_id = ?",
            [id, order_id]
        );



        // Update user wallet balance
        await connection.execute("UPDATE users SET addamount = addamount + ? WHERE email = ?", [amount, email]);

        // Commit the transaction after all updates
        await connection.commit();

        // ✅ Allow frontend to access this header (Optional for any additional response processing)
        res.setHeader("x-rtb-fingerprint-id", "your-value-here");

        res.json({ success: true, message: "Payment verified successfully and wallet updated!", amount });

    } catch (error) {
        console.error("Error in payment webhook:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

