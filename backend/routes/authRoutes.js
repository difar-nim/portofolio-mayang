const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

// =============================================
// POST /api/auth/login
// Login admin
// =============================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah.' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login berhasil.',
            token,
            admin: { id: admin.id, username: admin.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

module.exports = router;
