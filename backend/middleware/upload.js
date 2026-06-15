const multer = require('multer');
const path = require('path');

// Menggunakan MEMORY STORAGE: file disimpan sementara di RAM,
// lalu disimpan ke database (LONGBLOB) - bukan ke disk.
// Ini penting karena Render free tier menghapus file di disk saat restart/redeploy.
const storage = multer.memoryStorage();

// Filter tipe file yang diizinkan
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file tidak didukung. Hanya pdf, doc, docx, ppt, pptx, xls, xlsx, zip, rar, jpg, png yang diizinkan.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // maksimal 2MB (disesuaikan untuk batas storage db4free.net 200MB)
});

module.exports = upload;
