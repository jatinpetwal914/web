require('dotenv').config();
const mysql = require('mysql2');

let connection = null;
try {
  connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'phadizon'
  });
  connection.connect((err) => {
    if (err) {
      console.error('MySQL connection error:', err.message);
      connection = null;
    } else {
      console.log('MySQL connected');
    }
  });
} catch (err) {
  console.error('MySQL init error:', err.message);
  connection = null;
}

module.exports = {
  query: function(sql, params, cb) {
    if (!connection) {
      const err = new Error('DB connection not available');
      if (typeof cb === 'function') return cb(err);
      return Promise.reject(err);
    }
    return connection.query(sql, params, cb);
  }
};
