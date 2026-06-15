const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test koneksi saat startup
pool.getConnection()
    .then(conn => {
        console.log('Database Aiven berhasil terhubung!');
        conn.release();
    })
    .catch(err => {
        console.error('Gagal koneksi ke database:', err.message);
    });

module.exports = pool;
