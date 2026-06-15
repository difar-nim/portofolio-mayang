// Script untuk membuat akun admin default
// Jalankan dengan: node seed.js

const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
    try {
        const username = 'mayang';
        const plainPassword = 'snims';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Cek apakah admin sudah ada
        const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);

        if (rows.length > 0) {
            // Update password jika sudah ada
            await pool.query('UPDATE admin SET password = ? WHERE username = ?', [hashedPassword, username]);
            console.log('Password admin berhasil di-update.');
        } else {
            await pool.query('INSERT INTO admin (username, password) VALUES (?, ?)', [username, hashedPassword]);
            console.log('Admin berhasil dibuat.');
        }

        console.log('==============================================');
        console.log('Username : admin');
        console.log('Password : admin123');
        console.log('==============================================');
        console.log('Silakan login menggunakan kredensial di atas.');

        process.exit(0);
    } catch (err) {
        console.error('Gagal seeding:', err);
        process.exit(1);
    }
}

seed();
