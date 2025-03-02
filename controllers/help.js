const db = require('../config/db.js');
const express = require('express');
const router = express.Router();

// Create Help Query Endpoint
exports.help = async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ error: 'Unauthorized: User not logged in' });
        }

        const email = req.session.user.email;
        // Destructure the incoming request body to get the necessary data
        const {orderid,type, query, time } = req.body;
//console.log(req.body)
        // Query to check if the email, order ID, and time already exist in the database
        const checkQuery = `
            SELECT * 
            FROM help 
            WHERE email = ? AND orderid = ? AND time = ?
        `;

        // Execute the query
        const [existing] = await db.execute(checkQuery, [email, orderid, time]);

        // If a record is found, send a response that the query already exists
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Query with the same email, order ID, and time already exists.'
            });
        }

        // If no existing query is found, insert the new query into the database
        const insertQuery = `
            INSERT INTO help (email, orderid,type, query, time) 
            VALUES (?, ?, ?, ?, ?)
        `;

        // Execute the insert query
        await db.execute(insertQuery, [email, orderid,type, query, time]);

        // Respond with success message
        res.status(200).json({
            success: true,
            message: 'Your query has been successfully submitted.'
        });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'There was an error while processing your request. Please try again later.'
        });
    }
};




exports.helpinfo = async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ error: 'Unauthorized: User not logged in' });
        }

        const email = req.session.user.email;

        // Ensure you specify the correct table (e.g., "users") in the query
        const checkQuery = `
            SELECT * 
            FROM help  -- Replace 'help' with your actual table name
            WHERE email = ?;
        `;

        // Execute the query
        const [rows] = await db.execute(checkQuery, [email]);

        // Log the rows to verify the query result
        //console.log('Fetched rows:', rows);

        // Check if the query returned no rows
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No query found for this user',
                query: []  // Return empty array instead of 204
            });
        }

        // Respond with the fetched data
        return res.status(200).json({
            success: true,
            message: 'Query successfully fetched!',
            query: rows,
        });

    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.helpinfoadmin = async (req, res) => {
    try {
        // // Check if the user is logged in
        // if (!req.session.user || !req.session.user.email) {
        //     return res.status(401).json({ error: 'Unauthorized: User not logged in' });
        // }

     
        // Ensure you specify the correct table (e.g., "users") in the query
        const checkQuery = `
            SELECT * 
            FROM help;
        `;

        // Execute the query
        const [rows] = await db.execute(checkQuery);

        // Log the rows to verify the query result
        //console.log('Fetched rows:', rows);

        // Check if the query returned no rows
        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No query found for this user',
                query: []  // Return empty array instead of 204
            });
        }

        // Respond with the fetched data
        return res.status(200).json({
            success: true,
            message: 'Query successfully fetched!',
            query: rows,
        });

    } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
// PUT Request to update the status of a help query
exports.helpupdate = async (req, res) => {
    try {
        // if (!req.session.user || !req.session.user.email) {
        //     return res.status(401).json({ error: 'Unauthorized: User not logged in' });
        // }

        // const email = req.session.user.email;
        const {email, orderid,time, status,Message } = req.body;
       
        // Validate the provided status
        const validStatuses = ['Pending', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status provided. Valid statuses are: Pending, In Progress, Resolved.'
            });
        }

        // Query to check if the email and order ID exist in the database
        const checkQuery = `
            SELECT * 
            FROM help 
            WHERE email = ? AND orderid = ?;
        `;

        // Execute the query to check if the record exists
        const [existing] = await db.execute(checkQuery, [email, orderid]);

        // If no record is found, send a response that the query does not exist
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No help query found with the provided email and order ID.'
            });
        }

        // Update the status of the query
        const updateQuery = `
            UPDATE help 
            SET status = ? , message = ?
            WHERE email = ? AND orderid = ? AND time = ?;
        `;

        // Execute the update query
        await db.execute(updateQuery, [status, Message || 'no', email, orderid,time]);

        // Respond with success message
        res.status(200).json({
            success: true,
            message: 'Help query status updated successfully.'
        });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'There was an error while updating the status. Please try again later.'
        });
    }
};

