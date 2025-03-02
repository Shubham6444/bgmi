const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authController');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const cors = require("cors");
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const server = http.createServer(app); // HTTP server setup
const apiKeyAuth = require('./middleware/authMiddleware');
app.use(apiKeyAuth);

// Middleware to parse JSON requests and URL-encoded data
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware (Must be before static files & routes)
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true } // Prevents client-side JS access
}));

const corsOptions = {
    origin: "*", // The frontend URL
    methods: 'GET,POST,PUT,DELETE', // Allowed methods
    allowedHeaders: 'Content-Type,Authorization,x-api-key', // Allowed headers
  };
  
  app.use(cors(corsOptions));

app.use(express.json());  // Yeh middleware laga do
app.use(express.urlencoded({ extended: true }));  // Yeh bhi optional hai



// Serve static files from the "public" folder
app.use(express.static('public'));

// Authentication routes
app.use('/auth', authRoutes);

// Redirect "/dashboard.html" to "/dashboard"
app.get('/dashboard.html', (req, res) => {
    res.redirect('/dashboard');
});

// Serve the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Function to check if the user is authenticated
function checkAuthentication(req, res, next) {
    if (req.session.user) {
        return next(); // Allow access if logged in
    } else {
        res.status(401).json({ error: 'You must be logged in to access this page' });
    }
}

// Protected route: Check if the user is authenticated
app.get('/session', checkAuthentication, (req, res) => {
    res.json({
        message: 'Auth success',
        user: req.session.user
    });
});

// Middleware to check if the user is authorized for the admin section
const adminAuthMiddleware = (req, res, next) => {
    if (!req.session.user || !req.session.user.email) {
        return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    if (req.session.user.email !== process.env.Admi_mail) {
        return res.status(403).json({ error: 'Forbidden: You do not have admin access' });
    }

    next(); // Proceed if the email matches
};

// Apply authentication middleware to protect the `/admin` directory
app.use('/admin', adminAuthMiddleware, express.static(path.join(__dirname, 'admin')));

// Admin session check route
app.get('/adminsession', adminAuthMiddleware, (req, res) => {
    res.json({
        message: 'Admin Auth Success',
        user: req.session.user
    });
});

// Catch-all route for 404 errors (custom error page)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
