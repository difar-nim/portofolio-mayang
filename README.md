# Portofolio Full Stack - Sitti Nur Iman Mayang Sari

Aplikasi portofolio dengan sistem manajemen tugas berbasis database.
Stack: **Node.js + Express + MySQL** (backend), **HTML/CSS/JS** (frontend).

## Struktur Folder

```
portfolio-fullstack/
├── database.sql          <- Jalankan ini di MySQL untuk membuat database & tabel
├── backend/
│   ├── server.js          <- Entry point server Express
│   ├── db.js               <- Koneksi MySQL
│   ├── seed.js             <- Membuat akun admin default
│   ├── .env                <- Konfigurasi (DB, JWT secret, port)
│   ├── middleware/
│   │   ├── authMiddleware.js  <- Verifikasi JWT
│   │   └── upload.js          <- Konfigurasi upload file (multer)
│   ├── routes/
│   │   ├── authRoutes.js      <- Login admin
│   │   └── tugasRoutes.js     <- CRUD tugas
│   └── uploads/             <- File yang diupload disimpan di sini
└── frontend/
    ├── index.html           <- Halaman utama (publik)
    ├── style.css
    ├── script.js            <- Mengambil data tugas dari API
    ├── config.js            <- URL API backend
    ├── dataset/
    │   └── mayang.jpg        <- Letakkan foto profil di sini
    └── admin/
        ├── login.html
        ├── dashboard.html
        ├── auth.js
        ├── dashboard.js
        └── admin.css
```

## 1. Setup Database

1. Buka MySQL (via XAMPP/phpMyAdmin/terminal MySQL).
2. Jalankan isi file `database.sql`. Ini akan membuat database `portofolio_db` dan tabel `admin` serta `tugas`.

```bash
mysql -u root -p < database.sql
```

## 2. Setup Backend

```bash
cd backend
npm install
```

Edit file `.env` sesuai konfigurasi MySQL Anda:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=portofolio_db
DB_PORT=3306
PORT=5000
JWT_SECRET=ganti_dengan_string_acak
```

Buat akun admin default (username: `admin`, password: `admin123`):

```bash
npm run seed
```

Jalankan server:

```bash
npm start
```

Server berjalan di `http://localhost:5000`.

## 3. Setup Frontend

Buka folder `frontend` menggunakan **Live Server** (ekstensi VSCode) atau server statis lainnya
(jangan dibuka langsung sebagai file karena fetch API butuh HTTP server).

- Halaman utama: `frontend/index.html`
- Halaman login admin: `frontend/admin/login.html`

Pastikan `config.js` mengarah ke alamat backend yang benar (default: `http://localhost:5000/api`).

## 4. Login Admin

- URL: `frontend/admin/login.html`
- Username: `admin`
- Password: `admin123`

**Disarankan untuk mengganti password setelah login pertama** (jalankan ulang `seed.js` dengan password baru di kode, atau buat fitur ganti password).

## Alur Sistem

```
Admin Login (JWT Token)
     ↓
Tambah / Edit / Hapus Tugas (lewat Dashboard)
     ↓
Data + File tersimpan di MySQL & folder uploads
     ↓
index.html (publik) otomatis menampilkan data terbaru via fetch API
```

## API Endpoints

| Method | Endpoint              | Akses   | Deskripsi                 |
|--------|-----------------------|---------|---------------------------|
| POST   | /api/auth/login       | Publik  | Login admin, dapat token  |
| GET    | /api/tugas            | Publik  | Ambil semua tugas         |
| GET    | /api/tugas/:id        | Publik  | Ambil satu tugas          |
| POST   | /api/tugas            | Admin   | Tambah tugas + upload file|
| PUT    | /api/tugas/:id        | Admin   | Edit tugas + ganti file    |
| DELETE | /api/tugas/:id        | Admin   | Hapus tugas + file         |

Endpoint Admin butuh header: `Authorization: Bearer <token>`
