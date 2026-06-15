const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware untuk memverifikasi token JWT pada halaman admin
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
}

module.exports = verifyToken;
