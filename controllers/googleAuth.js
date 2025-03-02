// controllers/googleAuthController.js

const bcrypt = require('bcrypt'); // Assuming you are using bcrypt for password hashing

const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const db = require('../config/db');
const { Console } = require('console');
require('dotenv').config();
// Google OAuth credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET =process.env.GOOGLE_CLIENT_SECRET ;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Redirect user to Google OAuth
exports.googleAuth = (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'select_account',
  });
  res.redirect(authUrl);
};

// Handle Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('No code received');

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    if (!tokens || !tokens.access_token) return res.status(500).send('Error: No valid access token received');

    // Fetch user information from Google
    const { data: userInfo } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    console.log('User Info:', userInfo);
    req.session.user = userInfo;
    // Check if the user already exists in the database
    const checkQuery = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [existingUser] = await db.execute(checkQuery, [userInfo.email]);

    let user;
    if (existingUser.length > 0) {
      // User already exists, use existing data
      user = existingUser[0];
    } else {
      // New user, create an account
      const insertQuery = 'INSERT INTO users (name, email, upiid, addamount, winamount, bgmi_id) VALUES (?, ?, ?, ?, ?, ?)';
      await db.execute(insertQuery, [userInfo.name, userInfo.email, ' ', 0, 0, '']);
      
      // Fetch the newly created user
      const [newUser] = await db.execute(checkQuery, [userInfo.email]);
      user = newUser[0];
    }
// Set session for authenticated user
req.session.user = userInfo;

// Send a response with a delayed redirect
res.send(`
  <html>
  <head>
      <title>Verification Successful</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              text-align: center;
              background-color: #f4f8ff;
              padding: 50px;
          }
          .container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
          }
          .cloud {
              font-size: 50px;
              animation: float 2s ease-in-out infinite;
          }
          @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
          }
          .message {
              font-size: 20px;
              font-weight: bold;
              margin-top: 20px;
              color: #333;
          }
          .countdown {
              font-size: 18px;
              color: #007bff;
              margin-top: 10px;
          }
          .loader {
              border: 5px solid #f3f3f3;
              border-radius: 50%;
              border-top: 5px solid #3498db;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
          }
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="cloud">☁️✅</div>
          <div class="message">Verification Successful!</div>
          <div class="loader"></div>
          <div class="countdown">Redirecting in <span id="timer">3</span> seconds...</div>
      </div>

      <script>
          let timeLeft = 3;
          const timerElement = document.getElementById("timer");

          const countdown = setInterval(() => {
              timeLeft--;
              timerElement.textContent = timeLeft;

              if (timeLeft <= 0) {
                  clearInterval(countdown);
                  window.location.href = "/toornament.html";
              }
          }, 1000);
      </script>
  </body>
  </html>
`);


  } catch (error) {
    console.error('Error in Google authentication:', error);
    res.status(500).send('Authentication failed');
  }
};

exports.customLogin = async (req, res) => {
  const { email, password } = req.body;
  
  // Check if email or password is missing
  if (!email || !password) {
      return res.status(400).json({
          message: 'Email and password are required'
      });
  }

  try {
      // Query to check if the user exists
      const checkQuery = 'SELECT * FROM users WHERE email = ? LIMIT 1';
      const [existingUser] = await db.execute(checkQuery, [email]);

      if (existingUser.length > 0) {
          const user = existingUser[0];

          // Compare the provided password with the hashed password stored in the database
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
              // If the password matches, store user data in session
              req.session.user = { email }; // Store only necessary user data
              return res.status(200).json({
                  message: 'Login successful',
                  user: req.session.user
              });
          } else {
              return res.status(401).json({
                  message: 'Invalid credentials'
              });
          }
      } else {
          return res.status(404).json({
              message: 'User not found'
          });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          message: 'Internal server error'
      });
  }
};



















exports.customSignup = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if name, email, or password is missing
  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Name, email, and password are required'
    });
  }

  try {
    // Check if the email already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [existingUser] = await db.execute(checkQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'Email already registered'
      });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert the new user into the database
    const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    await db.execute(insertQuery, [name, email, hashedPassword]);
    req.session.user = { email }; // Store only necessary user data
    return res.status(200).json({
        message: 'Login successful',
        user: req.session.user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// Logout function
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/');
  });
};
