const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/tugas - Publik
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, judul, deskripsi, file, tanggal, created_at FROM tugas ORDER BY tanggal DESC, id DESC'
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
            'SELECT id, judul, deskripsi, file, tanggal FROM tugas WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil data tugas.' });
    }
});

// POST /api/tugas - Admin
router.post('/', verifyToken, async (req, res) => {
    const { judul, deskripsi, tanggal, file } = req.body;
    if (!judul || !tanggal) return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });
    try {
        const [result] = await pool.query(
            'INSERT INTO tugas (judul, deskripsi, file, tanggal) VALUES (?, ?, ?, ?)',
            [judul, deskripsi || null, file || null, tanggal]
        );
        res.status(201).json({ message: 'Tugas berhasil ditambahkan.', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menambahkan tugas.' });
    }
});

// PUT /api/tugas/:id - Admin
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { judul, deskripsi, tanggal, file } = req.body;
    if (!judul || !tanggal) return res.status(400).json({ message: 'Judul dan tanggal wajib diisi.' });
    try {
        const [rows] = await pool.query('SELECT id FROM tugas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        await pool.query(
            'UPDATE tugas SET judul = ?, deskripsi = ?, file = ?, tanggal = ? WHERE id = ?',
            [judul, deskripsi || null, file || null, tanggal, id]
        );
        res.json({ message: 'Tugas berhasil diperbarui.' });
    } catch (err) {
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
