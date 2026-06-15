const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// =============================================
// GET /api/tugas
// Mengambil semua data tugas (PUBLIK - untuk website)
// Tidak mengirim file_data (BLOB) agar response ringan
// =============================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, judul, deskripsi, file_name, file_type, tanggal, created_at, updated_at
             FROM tugas ORDER BY tanggal DESC, id DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// =============================================
// GET /api/tugas/:id
// Mengambil satu data tugas berdasarkan id (PUBLIK)
// =============================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, judul, deskripsi, file_name, file_type, tanggal, created_at, updated_at
             FROM tugas WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// =============================================
// GET /api/tugas/:id/file
// Mengunduh / menampilkan file dari database (PUBLIK)
// =============================================
router.get('/:id/file', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT file_data, file_name, file_type FROM tugas WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0 || !rows[0].file_data) {
            return res.status(404).json({ message: 'File tidak ditemukan.' });
        }

        const { file_data, file_name, file_type } = rows[0];

        res.setHeader('Content-Type', file_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
        res.send(file_data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil file.' });
    }
});

// =============================================
// POST /api/tugas
// Menambah tugas baru (ADMIN - butuh token + upload file)
// =============================================
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
    const { judul, deskripsi, tanggal } = req.body;

    if (!judul || !tanggal) {
        return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });
    }

    const fileData = req.file ? req.file.buffer : null;
    const fileName = req.file ? req.file.originalname : null;
    const fileType = req.file ? req.file.mimetype : null;

    try {
        const [result] = await pool.query(
            'INSERT INTO tugas (judul, deskripsi, file_data, file_name, file_type, tanggal) VALUES (?, ?, ?, ?, ?, ?)',
            [judul, deskripsi || null, fileData, fileName, fileType, tanggal]
        );

        res.status(201).json({
            message: 'Tugas berhasil ditambahkan.',
            id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menambahkan tugas.' });
    }
});

// =============================================
// PUT /api/tugas/:id
// Mengedit tugas (ADMIN - butuh token, file opsional)
// =============================================
router.put('/:id', verifyToken, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { judul, deskripsi, tanggal } = req.body;

    if (!judul || !tanggal) {
        return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });
    }

    try {
        const [rows] = await pool.query('SELECT id FROM tugas WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        }

        if (req.file) {
            await pool.query(
                'UPDATE tugas SET judul = ?, deskripsi = ?, file_data = ?, file_name = ?, file_type = ?, tanggal = ? WHERE id = ?',
                [judul, deskripsi || null, req.file.buffer, req.file.originalname, req.file.mimetype, tanggal, id]
            );
        } else {
            await pool.query(
                'UPDATE tugas SET judul = ?, deskripsi = ?, tanggal = ? WHERE id = ?',
                [judul, deskripsi || null, tanggal, id]
            );
        }

        res.json({ message: 'Tugas berhasil diperbarui.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal memperbarui tugas.' });
    }
});

// =============================================
// DELETE /api/tugas/:id
// Menghapus tugas (ADMIN - butuh token)
// =============================================
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT id FROM tugas WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        }

        await pool.query('DELETE FROM tugas WHERE id = ?', [id]);

        res.json({ message: 'Tugas berhasil dihapus.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menghapus tugas.' });
    }
});

module.exports = router;
