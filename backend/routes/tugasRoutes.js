const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

// Konfigurasi Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: upload buffer ke Cloudinary
function uploadToCloudinary(buffer, originalname) {
    return new Promise((resolve, reject) => {
        const fileName = originalname.replace(/\s+/g, '_').replace(/\.[^/.]+$/, '');
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'tugas-portofolio',
                public_id: `${Date.now()}-${fileName}`,
                resource_type: 'auto' // otomatis detect: pdf, image, dll
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

// GET /api/tugas - Publik
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, judul, deskripsi, file, file_name, tanggal, created_at FROM tugas ORDER BY tanggal DESC, id DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// GET /api/tugas/:id - Publik
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, judul, deskripsi, file, file_name, tanggal FROM tugas WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// POST /api/tugas - Admin
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
    const { judul, deskripsi, tanggal } = req.body;
    if (!judul || !tanggal) return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });

    let fileUrl = null;
    let fileName = null;

    try {
        // Upload ke Cloudinary jika ada file
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
            fileUrl = result.secure_url;
            fileName = req.file.originalname;
        }

        const [result] = await pool.query(
            'INSERT INTO tugas (judul, deskripsi, file, file_name, tanggal) VALUES (?, ?, ?, ?, ?)',
            [judul, deskripsi || null, fileUrl, fileName, tanggal]
        );

        res.status(201).json({ message: 'Tugas berhasil ditambahkan.', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menambahkan tugas.' });
    }
});

// PUT /api/tugas/:id - Admin
router.put('/:id', verifyToken, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { judul, deskripsi, tanggal } = req.body;
    if (!judul || !tanggal) return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });

    try {
        const [rows] = await pool.query('SELECT id, file FROM tugas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

        let fileUrl = rows[0].file;
        let fileName = rows[0].file_name;

        // Jika ada file baru, upload ke Cloudinary
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
            fileUrl = result.secure_url;
            fileName = req.file.originalname;
        }

        await pool.query(
            'UPDATE tugas SET judul = ?, deskripsi = ?, file = ?, file_name = ?, tanggal = ? WHERE id = ?',
            [judul, deskripsi || null, fileUrl, fileName, tanggal, id]
        );

        res.json({ message: 'Tugas berhasil diperbarui.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal memperbarui tugas.' });
    }
});

// DELETE /api/tugas/:id - Admin
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id FROM tugas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        await pool.query('DELETE FROM tugas WHERE id = ?', [id]);
        res.json({ message: 'Tugas berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus tugas.' });
    }
});

module.exports = router;
