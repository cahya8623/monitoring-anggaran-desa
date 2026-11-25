# Ruang Anggaran Desa

Aplikasi portofolio untuk transparansi anggaran desa. Dibangun dengan Next.js App Router, JavaScript, Tailwind CSS, SQLite, dan Route Handlers.

## Menjalankan secara lokal

1. Pastikan Node.js 20.9 atau lebih baru sudah tersedia.
2. Isi konfigurasi email SMTP pada `.env.local` jika ingin mengaktifkan reset password melalui email.
3. Jalankan:

```bash
npm run dev
```

4. Buka http://localhost:3000.
5. Untuk membuat akun admin pertama, buka http://localhost:3000/setup-admin. Salin nilai `SETUP_TOKEN` dari `.env.local`, lalu buat username, email admin, dan password minimal 12 karakter. Setup awal otomatis ditutup setelah admin pertama berhasil dibuat.
6. Masuk melalui http://localhost:3000/login.

Database SQLite dan data seed dibuat otomatis pada `data/anggaran-desa.sqlite` di folder proyek ketika API pertama kali digunakan. Data awal mencakup contoh transaksi tahun 2023–2025 dan ditandai sebagai data simulasi.

## Reset password

Atur `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, dan `APP_URL` di `.env.local`. Fitur lupa password mengirim tautan sekali pakai yang kedaluwarsa dalam 30 menit. Token reset hanya disimpan dalam bentuk SHA-256 di database.

## Fitur

- Dashboard publik: filter tahun, KPI, grafik arus anggaran, belanja per kategori, pencarian dan filter transaksi, paginasi.
- Profil desa demo beserta peta OpenStreetMap ilustratif.
- Panel admin terlindungi: login JWT dalam cookie HttpOnly, tambah/edit/hapus transaksi, dan rekap tahunan.
- Password admin di-hash menggunakan bcrypt; reset password memakai email SMTP dan token sekali pakai.
- Validasi data pada server dan pesan loading, kosong, serta error.

## Sebelum dipublikasikan

Semua nama, profil, koordinat, dan transaksi bawaan merupakan data simulasi. Ganti dengan data yang benar-benar sudah diverifikasi. Konfigurasikan rahasia dan SMTP pada environment deployment—jangan unggah `.env.local` atau kredensial ke repository. SQLite cocok untuk pengembangan/hosting satu instance dengan disk persisten; untuk deployment serverless atau multi-instance, gunakan penyimpanan database bersama.

