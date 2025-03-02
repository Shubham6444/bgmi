const mysql = require('mysql2');

// MySQL Connection Pool Setup
const db = mysql.createPool({
  host: 'srv1152.hstgr.io',
  user: 'u777472751_bgmi',
  password: 'Change@#64',
  database: 'u777472751_bgmi',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10, // Limit connections to avoid overload
  queueLimit: 0,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  enableKeepAlive: true, // Keep-alive enabled to prevent disconnects
  keepAliveInitialDelay: 10000, // Keep-alive delay
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Connection Failed:', err.code, err.message);
    return;
  }
  console.log('✅ MySQL Connected! Thread ID:', connection.threadId);
  connection.release(); // Release the connection back to the pool
});

// Export the promise-based pool
module.exports = db.promise();
