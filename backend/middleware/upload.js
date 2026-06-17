const multer = require('multer');

// Simpan file di memory buffer (tidak di disk)
// karena langsung dikirim ke Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar|jpg|jpeg|png/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file tidak didukung.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // max 10MB
});

module.exports = upload;
