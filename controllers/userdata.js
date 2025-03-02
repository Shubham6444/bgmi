const express = require('express');
const mysql = require('mysql2');
const app = express();

const db = require('../config/db.js');

exports.userdata = async (req, res) => {
    try {
      // Execute queries sequentially
      const [users] = await db.execute('SELECT * FROM users');
      const [walletHistory] = await db.execute('SELECT email, amount, method, time, status, order_id,payid FROM wallet_history');
      const [battle_stats] = await db.execute('SELECT user_id, battle_id, total_kills, won_amount FROM battle_stats');
      const [battles] = await db.execute('SELECT * FROM battals');
  
      // Render the data on a single page (assuming you're using a template engine like Pug)
      res.json({ users, walletHistory, battles, battle_stats });    } catch (error) {
      console.error('Database query error:', error);
      res.status(500).send('Database query error');
    }
  };
  
  
  exports.updateUser = async (req, res) => {
    const { userId, name, email, upiid, addamount, winamount, bgmi_id } = req.body;
   

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        await db.execute(
            "UPDATE users SET name = ?, email = ?, upiid = ?, addamount = ?, winamount = ?, bgmi_id = ? WHERE id = ?",
            [name, email, upiid, addamount, winamount, bgmi_id, userId] // Corrected the order of parameters
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};



exports.deleteUser = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        await db.execute("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

// Update total_kill, won_amount, and other fields based on email
exports.updateTournamentByEmail = async (req, res ) => {



    if (!req.session.user || !req.session.user.email) {
        return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    if (req.session.user.email !== 'skm11794@gmail.com') {
        return res.status(403).json({ error: 'Forbidden: You do not have admin access' });
    }

   

    try {
       // const email = req.session.user.email;
  
        const {email,battle_id, total_kill, won_amount } = req.body;

        if (!email || !battle_id || total_kill === undefined || won_amount === undefined) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        const updateQuery = `
        UPDATE battle_stats 
        SET total_kills = ?, won_amount = ? 
        WHERE user_id = ? AND battle_id = ?
    `;
    const [result] = await db.execute(updateQuery, [total_kill, won_amount, email, battle_id]);

   
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Tournament not found for this email!" });
        }

        return res.status(200).json({ success: true, message: "Tournament updated successfully!" });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Function to update status to 'completed' and fetch all wallet history
exports.completeHistory = async (req, res) => {
    const { order_id, payid } = req.body; // Assuming the order ID or Pay ID is sent via the request body

    if (!order_id && !payid) {
        return res.status(400).json({ error: 'Order ID or Pay ID is required' });
    }

    try {
        // Step 1: Update the status to 'completed' for the given order_id or payid
        const updateQuery = `
            UPDATE wallet_history 
            SET status = 'completed'
            WHERE order_id = ? OR payid = ?
        `;
        
        // Execute the update query
        await db.execute(updateQuery, [order_id, payid]);

        // Step 2: Fetch all wallet history to show updated records
        const [walletHistory] = await db.execute('SELECT email, amount, method, time, status, order_id, payid FROM wallet_history');

        // Step 3: Respond with the updated wallet history
        return res.status(200).json({
            message: 'Status updated to completed successfully',
            walletHistory
        });

    } catch (error) {
        console.error('Error updating wallet history:', error);
        return res.status(500).json({ error: 'An error occurred while updating the wallet history' });
    }
};
