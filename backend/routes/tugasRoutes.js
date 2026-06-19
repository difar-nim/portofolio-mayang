const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { google } = require('googleapis');
const { Readable } = require('stream');
require('dotenv').config();

// Inisialisasi Google Drive API
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Upload file ke Google Drive
async function uploadToDrive(buffer, originalname, mimetype) {
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    const response = await drive.files.create({
        requestBody: {
            name: `${Date.now()}-${originalname}`,
            parents: [FOLDER_ID]
        },
        media: {
            mimeType: mimetype,
            body: bufferStream
        },
        fields: 'id, name, webViewLink'
    });

    // Set file agar bisa diakses publik
    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    return {
        fileId: response.data.id,
        fileName: originalname,
        webViewLink: response.data.webViewLink,
        directLink: `https://drive.google.com/file/d/${response.data.id}/view`
    };
}

// Hapus file dari Google Drive
async function deleteFromDrive(fileUrl) {
    if (!fileUrl) return;
    try {
        const match = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            await drive.files.delete({ fileId: match[1] });
        }
    } catch (err) {
        console.error('Gagal hapus file dari Drive:', err.message);
    }
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
        if (req.file) {
            const result = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
            fileUrl = result.directLink;
            fileName = result.fileName;
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

        if (req.file) {
            // Hapus file lama dari Drive
            await deleteFromDrive(rows[0].file);
            // Upload file baru
            const result = await uploadToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
            fileUrl = result.directLink;
            fileName = result.fileName;
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
        const [rows] = await pool.query('SELECT id, file FROM tugas WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

        // Hapus file dari Drive juga
        await deleteFromDrive(rows[0].file);

        await pool.query('DELETE FROM tugas WHERE id = ?', [id]);
        res.json({ message: 'Tugas berhasil dihapus.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus tugas.' });
    }
});

module.exports = router;
