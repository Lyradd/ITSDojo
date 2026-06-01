# ITSDojo 🎓

ITSDojo adalah platform **Gamified Learning Management System (LMS)** modern yang dikembangkan menggunakan **Next.js 15 (App Router)**, **Socket.io (WebSockets)**, dan **Drizzle ORM** dengan **Neon PostgreSQL**. Platform ini dirancang untuk menghadirkan pengalaman belajar yang interaktif dan kompetitif bagi mahasiswa melalui fitur gamifikasi, evaluasi coding secara langsung, duel real-time, dan pemisahan hak akses yang jelas antara Mahasiswa, Asisten Dosen, Dosen, dan Admin.

---

## 🛠️ Tech Stack Utama

*   **Framework:** Next.js 15 (App Router) dengan TypeScript & Turbopack
*   **Database:** Serverless PostgreSQL (Neon) & Drizzle ORM
*   **Real-time & WebSockets:** Socket.io (server kustom `server.js` terintegrasi)
*   **Styling:** Tailwind CSS & Shadcn UI
*   **State Management:** Zustand
*   **Rich Text Editor:** `react-quill-new` (WYSIWYG editor materi)

---

## 🚀 Langkah-Langkah Menjalankan Project (Lokal)

Ikuti instruksi langkah demi langkah berikut secara berurutan untuk memasang dan menjalankan proyek ITSDojo di komputer lokal Anda:

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org/) (versi LTS terbaru direkomendasikan)
*   Akun [Neon Console](https://neon.tech/) (atau instansi database PostgreSQL lokal yang aktif)

### 2. Kloning & Instalasi Dependensi
Buka terminal Anda, masuk ke direktori proyek, lalu pasang paket dependensi yang dibutuhkan:
```bash
# Install seluruh package dependensi proyek
npm install
```
*Penting: Seluruh dependensi utama (seperti `three.js`, `socket.io`, `react-quill-new`, `zustand`, `framer-motion`, dan komponen `shadcn/ui`) sudah terdaftar lengkap di `package.json` sehingga perintah di atas akan menginstal semuanya secara otomatis.*

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Buat sebuah berkas bernama `.env` di direktori utama (root) proyek, kemudian masukkan konfigurasi database Anda. 

*Catatan: Sangat disarankan untuk menggunakan **Pooled Connection String** jika Anda menggunakan Neon Database.*

```env
# Contoh isi berkas .env
DATABASE_URL="postgresql://neondb_owner:PASSWORD_ANDA@endpoint-aws-neon.tech/neondb?sslmode=require"
```

### 4. Sinkronisasi Skema Database (Drizzle Push)
Setelah kredensial database terpasang dengan benar di `.env`, jalankan perintah berikut untuk mensinkronisasikan berkas skema di `db/schema.ts` ke database PostgreSQL Anda secara otomatis:
```bash
npx drizzle-kit push
```

### 5. Jalankan Server Pengembangan (Development Server)
Jalankan server Next.js lokal terintegrasi dengan WebSocket:
```bash
npm run dev
```
Setelah berjalan, buka tautan **[http://localhost:3000](http://localhost:3000)** di browser Anda.

### 6. Ekspos Aplikasi ke Internet untuk Testing (Cloudflare Tunnel)
Jika Anda ingin mengekspos aplikasi pengembangan lokal (`http://localhost:3000`) ke internet agar bisa diuji oleh orang lain (misal: mahasiswa/dosen) dari luar jaringan lokal secara global:
1. Pastikan Anda sudah menginstal [Cloudflare Tunnel (cloudflared)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Pastikan server lokal Anda sudah berjalan (`npm run dev`).
3. Buka terminal baru, jalankan perintah tunnel gratis berikut:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
4. Salin tautan publik bertipe `https://*.trycloudflare.com` yang muncul di terminal dan bagikan ke penguji/mahasiswa.

---

## 👥 Panduan Pengujian & Akun Demo

Untuk memudahkan eksplorasi fitur dan alur kerja di ITSDojo, sistem login menggunakan mode simulasi instan (Demo Mode). Anda cukup mengeklik tombol masuk tanpa perlu memasukkan kata sandi rumit:

1.  **Mahasiswa (👨‍🎓 Student View):**
    *   **Akses:** Pilih role **Mahasiswa** saat login.
    *   **Fitur:** Menjelajahi roadmap pembelajaran dinamis, melakukan duel 1v1 secara *real-time* via WebSocket, mengumpulkan XP dan Gems, serta mengerjakan soal coding terintegrasi.
2.  **Dosen (👨‍🏫 Instructor View):**
    *   **Akses:** Pilih role **Dosen** saat login.
    *   **Fitur:** Mengelola materi secara detail (menambah modul, menulis rangkuman pelajaran dengan editor rich-text, menempelkan URL YouTube/Google Drive dengan auto-preview, mengunggah lampiran PDF/DOCX, dan merancang soal coding latihan beserta test cases-nya).
3.  **Super Admin (🛠️ Admin View):**
    *   **Akses:** Klik tombol jalan pintas developer **"Bypass to Super Admin (Dev Only)"** di bagian bawah kartu login.
    *   **Fitur:** Membuat kelas global baru secara keseluruhan, memantau data performa pengguna, serta melakukan **Ploting Dosen** (menugaskan dosen pengampu ke kelas-kelas yang aktif).

---

## 📊 Manajemen Database Visual (Drizzle Studio)

Jika Anda ingin melihat, menambah, atau memanipulasi data di database secara visual melalui antarmuka web (mirip dengan phpMyAdmin), jalankan perintah berikut di terminal baru:
```bash
npx drizzle-kit studio
```
Lalu buka tautan lokal yang tertera di terminal (biasanya `https://local.drizzle.studio`) untuk mengelola tabel secara langsung.
