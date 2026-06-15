const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi ke MySQL Aiven (Aiven mewajibkan koneksi SSL)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000,
    ssl: {
        // rejectUnauthorized: false supaya tidak perlu upload file CA certificate manual
        rejectUnauthorized: false
    }
});

module.exports = pool;
