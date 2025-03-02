const db = require('../config/db.js');
const express = require('express');
const router = express.Router();

// Create Tournament Endpoint
exports.Create_tournaments = async (req, res) => {

    try {
        const { battleId, heading, time, currentParticipants, joinFee } = req.body;

        // Validate input
        if (!battleId || !heading || !time || currentParticipants === undefined || joinFee === undefined) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Ensure currentParticipants and joinFee are numbers
        const participants = Number(currentParticipants);
        const fee = Number(joinFee);

        if (isNaN(participants) || isNaN(fee)) {
            return res.status(400).json({ message: "Invalid number format for participants or joinFee" });
        }

        // Check if battleId already exists
        const checkQuery = 'SELECT battleId FROM battals WHERE battleId = ? LIMIT 1';
        const [existing] = await db.execute(checkQuery, [battleId]);

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Battle ID already exists' });
        }

        // Insert new tournament
        const insertQuery = 'INSERT INTO battals (battleId, heading, time, currentParticipants, joinFee) VALUES (?, ?, ?, ?, ?)';
        await db.execute(insertQuery, [battleId, heading, time, participants, fee]);

        return res.status(201).json({ success: true, message: 'Tournament created successfully!' });

    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Update only the time field
exports.Update_tournament = async (req, res) => {
    try {
        const { battleId, heading, time, currentParticipants, joinFee, roomId, password } = req.body;

        if (!battleId || !heading || !time || currentParticipants === undefined || joinFee === undefined) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const participants = Number(currentParticipants);
        const fee = Number(joinFee);
        if (isNaN(participants) || isNaN(fee)) {
            return res.status(400).json({ message: "Invalid number format for participants or joinFee" });
        }

        const updateQuery = 'UPDATE battals SET heading = ?, time = ?, currentParticipants = ?, joinFee = ?,roomId = ?, password = ? WHERE battleId = ?';
        const [result] = await db.execute(updateQuery, [heading, time, currentParticipants, joinFee, roomId, password, battleId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournament not found!' });
        }

        return res.status(200).json({ success: true, message: 'Tournament updated successfully!' });
    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete Tournament
exports.Delete_tournament = async (req, res) => {
    try {
        const { battleId } = req.body;
        if (!battleId) {
            return res.status(400).json({ message: "Battle ID is required!" });
        }

        const deleteQuery = 'DELETE FROM battals WHERE battleId = ?';
        const [result] = await db.execute(deleteQuery, [battleId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tournament not found!' });
        }

        return res.status(200).json({ success: true, message: 'Tournament deleted successfully!' });
    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};












// Get All Tournaments Endpoint
exports.tournaments = async (req, res) => {
    if (!req.session.user?.email) {
        return res.status(500).json({ success: false, message: "Failed to retrieve tournaments" });

    }
    try {

        const [rows] = await db.execute("SELECT * FROM battals");
        res.status(200).json(rows);
        // console.log(rows)
    } catch (error) {
        console.error("Error fetching tournaments:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve tournaments" });
    }
}


exports.joined = async (req, res) => {
    if (!req.session.user?.email) {
        return res.status(400).send('User email not found in session');
    }
    const battleId = req.query.battleId;
    if (!battleId) {
        return res.status(400).json({ error: "Missing battleId parameter" });
    }

    const query = "SELECT * FROM battle_stats WHERE battle_id = ?";
    // console.log(battleId);

    try {
        // Assuming you have a MySQL pool setup
        const [results] = await db.execute(query, [battleId]); // Use promise-based query
        res.json(results);
    } catch (err) {
        console.error("Error fetching battle stats:", err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.joinedall = async (req, res) => {
    // if (!req.session.user?.email) {
    //     return res.status(400).send('User email not found in session');
    //   }
    //   const email = req.session.user.email;

    // if (!battleId) {
    //     return res.status(400).json({ error: "Missing battleId parameter" });
    // }

    const query = "SELECT * FROM battle_stats";
    // console.log(battleId);

    try {
        // Assuming you have a MySQL pool setup
        const [results] = await db.execute(query); // Use promise-based query
        res.json(results);
    } catch (err) {
        console.error("Error fetching battle stats:", err);
        res.status(500).json({ error: "Database error" });
    }
};


exports.checkingJoin = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user?.email) {
            return res.status(401).json({ success: false, message: "Please log in again." });
        }

        const { battleId } = req.body;
        const userid = req.session.user.email;
        //console.log(battleId)
        if (!battleId) {
            return res.status(400).json({ success: false, message: "Battle ID is required." });
        }

        // Check if user has already joined the battle
        const userInBattleQuery = "SELECT * FROM battle_stats WHERE battle_id = ? AND user_id = ?";
        const [existingParticipant] = await db.execute(userInBattleQuery, [battleId, userid]);

        if (existingParticipant.length > 0) {
            return res.status(200).json({ success: false, message: "You have already joined this battle." });
        }

        // If user hasn't joined, return success
        return res.status(200).json({ success: true, message: "You can join this battle." });

    } catch (error) {
        console.error("Error checking battle join status:", error);
        return res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
    }
};

exports.joinenow = async (req, res) => {
    if (!req.session.user?.email) {
        return res.status(400).json({ success: false, message: "Login again" });
    }

    const { bgmiid, freefireid, battleId, fee } = req.body;
    let userid = req.session.user.email;
    //console.log( req.body)
    if (!battleId && !bgmiid && !freefirid) {
        return res.status(400).json({ success: false, message: "Battle ID is required." });
    }

    try {
        // Start a transaction to prevent race conditions
        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Fetch user balance with FOR UPDATE (Lock Row)
        const userQuery = "SELECT email, addamount, winamount FROM users WHERE email = ? FOR UPDATE";
        const [user] = await connection.execute(userQuery, [userid]);

        if (!user.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "User not found." });
        }

        const email = user[0].email;
        let addBalance = user[0].addamount;
        let winBalance = user[0].winamount;
        let totalBalance = addBalance + winBalance;

        // Check if user has enough balance
        if (totalBalance < fee) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Insufficient balance." });
        }

        // Fetch battle details
        const battleQuery = "SELECT currentParticipants FROM battals WHERE battleId = ? FOR UPDATE";
        const [battle] = await connection.execute(battleQuery, [battleId]);

        if (!battle.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Battle not found." });
        }

        let currentParticipants = battle[0].currentParticipants;

        // Check if battle is full
        if (currentParticipants >= 100) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Battle is full (Max 100 participants)." });
        }

        // Check if user already joined
        const userInBattleQuery = "SELECT 1 FROM battle_stats WHERE battle_id = ? AND user_id = ?";
        const [existingParticipant] = await connection.execute(userInBattleQuery, [battleId, userid]);

        if (existingParticipant.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "You have already joined this battle." });
        }

       // Deduct fee: First from winamount, then from addamount if needed
// Deduct fee: First from addamount, then from winamount if needed
let remainingFee = fee;
let newAddBalance = addBalance;
let newWinBalance = winBalance;

if (newAddBalance >= remainingFee) {
    newAddBalance -= remainingFee;
    remainingFee = 0;
} else {
    remainingFee -= newAddBalance;
    newAddBalance = 0;
    newWinBalance -= remainingFee;
}



        // Update user balance
        await connection.execute("UPDATE users SET winamount = ?, addamount = ? WHERE email = ?", [newWinBalance, newAddBalance, userid]);

        // Insert wallet history
        const transactionId = `Join_${Date.now()}_${email.slice(0, 5)}`;
        const short = transactionId.slice(0, -6); // Remove last 6 chars
        const insertHistoryQuery = `
            INSERT INTO wallet_history (email, amount, method, time, status, order_id) 
            VALUES (?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+05:30'), ?, ?)
        `;
        await connection.execute(insertHistoryQuery, [email, fee, 'Battle Join', 'Joined', short]);

        // Add user to battle
        await connection.execute("INSERT INTO battle_stats (user_id,gameid, battle_id) VALUES (?,?, ?)", [userid, bgmiid + '/' + freefireid, battleId]);

        // Update current participants count
        await connection.execute("UPDATE battals SET currentParticipants = currentParticipants + 1 WHERE battleId = ?", [battleId]);

        // Commit the transaction
        await connection.commit();
        connection.release();

        return res.status(200).json({ success: true, message: "Successfully joined the battle!" });

    } catch (error) {
        console.error("Error joining battle:", error);
        return res.status(500).json({ success: false, message: "Failed to join battle. Try again." });
    }
};
