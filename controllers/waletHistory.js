require('dotenv').config();
const db = require('../config/db');

// Controller to fetch wallet transaction history for a user
exports.fetchTransactionHistory = async (req, res) => {
    try {
        // Ensure the user is authenticated by checking the session
        const userEmail = req.session.user?.email;

        if (!userEmail) {
            return res.status(400).send('User email not found in session');
        }

        // If no email is found, it means the user is unauthorized
        if (!userEmail) {
            return res.status(401).json({ success: false, message: 'Unauthorized access' });
        }

        // Get last updated timestamp from query params (defaults to the earliest date possible)
        const lastUpdated = req.query.lastUpdated || "1970-01-01 00:00:00";

        // Validate the lastUpdated format to be a proper timestamp
        if (isNaN(Date.parse(lastUpdated))) {
            return res.status(400).json({ success: false, message: 'Invalid lastUpdated timestamp format' });
        }

        // Query to fetch wallet transactions that are newer than lastUpdated
        const query = `
            SELECT amount, method, time, status, order_id 
            FROM wallet_history 
            WHERE email = ? AND time > ?
            ORDER BY time DESC
        `;
        const [rows] = await db.execute(query, [userEmail, lastUpdated]);

        // If no new transactions are found
        if (rows.length === 0) {
            return res.status(200).json({ success: true, message: 'No new transactions', wallet: [], lastUpdated });
        }

        // If new transactions are found, return them with the latest timestamp
        return res.status(200).json({
            success: true,
            message: "New transactions retrieved successfully!",
            wallet: rows,
            lastUpdated: rows[0].time // Send the latest timestamp from the most recent transaction
        });

    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
