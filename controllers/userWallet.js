
const db = require('../config/db.js');
const express = require('express');
const router = express.Router();
// ✅ Get Wallet & Profile Details (All Transactions)
exports.userwallet = async (req, res) => {
    if (!req.session.user?.email) {
        return res.status(400).send('User email not found in session');
      }
      
      const userId = req.session.user.email;
      
        try {
            // 🔹 Get userId from session
           // req.session.userId;
    
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized access' });
            }
    
            // 🔹 Fetch user wallet & profile details
            const query = `
                SELECT name, email,password, upiid, addamount, winamount, bgmi_id,freefir_id
                FROM users 
                WHERE email = ? LIMIT 1
            `;
            const [rows] = await db.execute(query, [userId]);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            return res.status(200).json({
                success: true,
                message: "Wallet details retrieved successfully!",
                wallet: rows[0]
            });
    
        } catch (error) {
            console.error('Database error:', error.message);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
    exports.withdraw = async (req, res) => {
        if (!req.session.user?.email) {
            return res.status(400).json({ success: false, message: 'User email not found in session' });
        }
    
        const userId = req.session.user.email;
        const { amount } = req.body; // Withdrawal amount and UPI ID
    
        try {
            // Validate input
            if (!amount || isNaN(amount) || amount < 10) {
                return res.status(400).json({ success: false, message: "Minimum withdrawal amount is ₹10." });
            }
    
            // Fetch user balance
            const query = "SELECT winamount FROM users WHERE email = ? LIMIT 1";
            const [user] = await db.execute(query, [userId]);
    
            if (!user.length) {
                return res.status(404).json({ success: false, message: "User not found." });
            }
    
            const winBalance = user[0].winamount;
    
            // **Check if user has enough win balance**
            if (winBalance < amount) {
                return res.status(400).json({ success: false, message: "Insufficient winnings balance." });
            }
    
            // **Deduct amount only from winamount**
            const newWinBalance = winBalance - amount;
    
            // **Update user balance (only winamount)**
            const updateQuery = "UPDATE users SET winamount = ? WHERE email = ?";
            await db.execute(updateQuery, [newWinBalance, userId]);
    
            // **Store withdrawal transaction**
            const insertHistoryQuery = `
                INSERT INTO wallet_history (email, amount, method, time, status, order_id) 
                VALUES (?, ?, 'Withdrawal', CONVERT_TZ(NOW(), '+00:00', '+05:30'), 'Pending...', ?)
            `;
            const transactionId = `WD_${Date.now()}_${userId.slice(0, 5)}`;
            const short = transactionId.slice(0, -6); // Last 6 characters ko chhod dega
            await db.execute(insertHistoryQuery, [userId, amount, short]);
    
            return res.status(200).json({ success: true, message: "Withdrawal request submitted successfully!" });
    
        } catch (error) {
            console.error("Error processing withdrawal:", error);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }
    };
    