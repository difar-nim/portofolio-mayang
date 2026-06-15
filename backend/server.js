const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const tugasRoutes = require('./routes/tugasRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder statis untuk file yang diupload (bisa diakses lewat /uploads/namafile)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/tugas', tugasRoutes);

// Route default
app.get('/', (req, res) => {
    res.json({ message: 'API Portofolio berjalan dengan baik.' });
});

// Handler error untuk multer & error lainnya
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
