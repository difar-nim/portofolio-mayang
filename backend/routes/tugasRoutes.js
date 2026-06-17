const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Deteksi apakah file adalah gambar atau bukan
function isImage(mimetype) {
    return mimetype && mimetype.startsWith('image/');
}

// Upload ke Cloudinary
// Gambar pakai resource_type 'image', file lain pakai 'raw'
function uploadToCloudinary(buffer, originalname, mimetype) {
    return new Promise((resolve, reject) => {
        const fileName = originalname.replace(/\s+/g, '_').replace(/\.[^/.]+$/, '');
        const resourceType = isImage(mimetype) ? 'image' : 'raw';

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'tugas-portofolio',
                public_id: `${Date.now()}-${fileName}`,
                resource_type: resourceType,
                // Untuk file non-gambar, paksa sebagai attachment agar bisa didownload
                ...(resourceType === 'raw' && {
                    flags: 'attachment'
                })
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}

// Buat URL download yang benar untuk semua tipe file
function getDownloadUrl(cloudinaryUrl, mimetype) {
    if (!cloudinaryUrl) return null;
    if (isImage(mimetype)) return cloudinaryUrl;

    // Untuk file non-gambar, tambahkan fl_attachment agar browser download
    return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
}

// GET /api/tugas - Publik
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, judul, deskripsi, file, file_name, file_type, tanggal, created_at FROM tugas ORDER BY tanggal DESC, id DESC'
        );
        // Tambahkan download_url untuk setiap tugas
        const tugasWithUrl = rows.map(t => ({
            ...t,
            download_url: getDownloadUrl(t.file, t.file_type)
        }));
        res.json(tugasWithUrl);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// GET /api/tugas/:id - Publik
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, judul, deskripsi, file, file_name, file_type, tanggal FROM tugas WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        const t = rows[0];
        res.json({ ...t, download_url: getDownloadUrl(t.file, t.file_type) });
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
    let fileType = null;

    try {
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
            fileUrl = result.secure_url;
            fileName = req.file.originalname;
            fileType = req.file.mimetype;
        }

        const [result] = await pool.query(
            'INSERT INTO tugas (judul, deskripsi, file, file_name, file_type, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
            [judul, deskripsi || null, fileUrl, fileName, fileType, tanggal]
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
        const [rows] = await pool.query('SELECT id, file, file_type FROM tugas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

        let fileUrl = rows[0].file;
        let fileName = rows[0].file_name;
        let fileType = rows[0].file_type;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
            fileUrl = result.secure_url;
            fileName = req.file.originalname;
            fileType = req.file.mimetype;
        }

        await pool.query(
            'UPDATE tugas SET judul = ?, deskripsi = ?, file = ?, file_name = ?, file_type = ?, tanggal = ? WHERE id = ?',
            [judul, deskripsi || null, fileUrl, fileName, fileType, tanggal, id]
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
