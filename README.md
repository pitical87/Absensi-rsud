# SIMARO — Frontend Absensi Pegawai RSUD Merauke

Aplikasi web **mobile-first** (React SPA) untuk pegawai RSUD Merauke — bagian depan dari sistem **SIMARO** (Sistem Informasi Monitoring Absensi RSUD Online). Seluruh data dikelola melalui API yang disediakan oleh `backend-absensi` (Laravel) di bawah prefix `/api/mobile`.

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool + dev server (proxy `/api` ke backend)
- **Tailwind CSS 4** — styling
- **React Router 8** — routing (based on the current `AppRoutes.tsx`)
- **Axios** — HTTP client (`withCredentials`, auto-redirect ke `/login` saat 401)
- **react-hook-form** — form handling + validasi
- **react-hot-toast** — notifikasi
- **Leaflet** — peta OpenStreetMap saat validasi lokasi
- **react-icons** — ikon

---

## Fitur

### 1. Autentikasi & Registrasi

- **Login** (`/login`) — login via email + password, menyimpan user & lokasi ke context, redirect ke dashboard.
- **Registrasi** (`/register`) — formulir lengkap: data pribadi, NIP, unit/sub-unit, profesi, kategori & posisi jabatan, seksi pembina, status pegawai (PNS/non-PNS), password. Beberapa field disembunyikan/dinonaktifkan berdasarkan kategori jabatan (mis. `Direktur` dan `Staf/Pelaksana` tidak mengisi nama jabatan; `Kepala Seksi/Sub Bagian`, `Kepala Bidang/Bagian`, `Direktur` tidak mengisi seksi pembina). Data master (unit, profesi, jabatan, posisi, dll.) dimuat dari `GET /api/mobile/register/master`.
- **Logout** — dari menu dropdown profil di navbar.

### 2. Dashboard (`/`)

Disusun dari beberapa seksi:

- **TopNavbar** — logo, tanggal hari ini, ikon notifikasi, avatar dengan dropdown berisi **Rekap Kehadiran** dan **Keluar**.
- **PerformaBanner** — banner rating bintang bulan lalu (`getPerformaBulan`), hanya dimuat pada 5 hari pertama tiap bulan dan tampil sekali per bulan per perangkat (flag `localStorage`).
- **Absensi** — kartu **Absen Masuk** & **Absen Pulang** dengan state yang saling mengunci (pulang hanya aktif setelah masuk). Jika hari ini ada izin, muncul banner "Sedang Izin/Cuti". Untuk **dokter**, absen boleh berkali-kali dalam sehari (multi-sesi).
- **HeroCard** — sapaan (`GetGreeting`), nama lengkap, jam masuk/pulang hari ini, dan badge jumlah sesi untuk dokter.
- **LogBookSection** — akses cepat **"Tulis Logbook"** → `/logbook`; tombol aktif hanya setelah absen masuk dan sebelum absen pulang (dan tidak sedang izin).
- **SifSection** — info **Shift Hari Ini** (kategori + jam + durasi, dari `getJadwal`), unit & jabatan/atasan, serta pintasan **Ajukan Izin** (`/izin`), **Ajukan Lembur** (`/lembur`), **Persetujuan** (`/persetujuan`) dan **Persetujuan Lembur** (`/persetujuan-lembur`) — dua terakhir hanya tampil untuk pengguna dengan posisi selain `Staf`, dengan indikator jumlah yang menunggu.
- **PresentStatistic** — statistik bulan berjalan: persentase kehadiran vs target, total jam kerja vs target, ketepatan masuk/pulang, dan rating bintang bulanan.
- **RecentPresents** — riwayat absensi 7 hari terakhir: jam masuk/pulang, status, menit terlambat, dan bintang (memperhitungkan multi-sesi dokter).

### 3. Absensi Masuk / Pulang (`/present/:type`)

Flow **3 langkah**:
1. **Lokasi** (`ValidateLocation`) — deteksi GPS, hitung jarak ke titik instansi dengan rumus Haversine, tampilkan posisi di peta Leaflet; hanya lanjut jika jarak ≤ radius maksimum.
2. **Selfie** (`ValidateSelfie`) — ambil foto dari kamera depan via `getUserMedia`.
3. **Konfirmasi** (`ConfirmPresent`) — kirim `POST /api/mobile/absen` (tipe `datang`/`pulang`, lat/lng, akurasi, foto) lalu tampilkan hasil (status, menit terlambat, bintang).

Rute menggunakan param `type` (`masuk` / `pulang`).

### 4. Absen Lembur (`/absen-lembur/:tipe`)

Flow 3 langkah yang sama (Lokasi → Selfie → Konfirmasi) untuk absen **masuk** dan **pulang** lembur. Mengambil parameter `tanggal` dari query string (tanggal pengajuan lembur yang disetujui); jika tidak ada tanggal maka dikembalikan ke `/lembur`. Menggunakan:
- `POST /api/mobile/absen-lembur` — absen masuk lembur
- `PUT /api/mobile/absen-lembur/pulang` — absen pulang lembur
- `GET /api/mobile/absen-lembur/status?tanggal=...` — status absen lembur hari itu

### 5. Izin / Sakit / Cuti / Dinas Luar (`/izin`)

Form pengajuan:
- **Jenis pengajuan**: Izin, Sakit, Dinas Luar — serta **Cuti** (hanya tampil untuk pegawai berstatus **PNS**), dilengkapi pilihan jenis cuti (Tahunan, Sakit, Melahirkan, dsb.).
- **Tanggal** mulai (wajib) dan selesai (opsional, otomatis dikoreksi agar tidak mendahului tanggal mulai), **alamat** (wajib untuk Izin & Cuti), **alasan/keperluan** (wajib), dan **lampiran** (PDF/JPG/PNG) dengan pratinjau gambar.
- Validasi dengan `react-hook-form`; pengiriman `multipart/form-data` ke `POST /api/mobile/izin`.

Riwayat pengajuan: tabel berisi jenis, rentang tanggal, lama (hari), keterangan, **alur persetujuan** per tahap (disetujui/ditolak/dilewati + nama pejabat), status, link lampiran, dan tombol **batalkan** (hanya untuk status `Menunggu`, dengan modal konfirmasi).

API: `GET /api/mobile/izin` (riwayat), `POST /api/mobile/izin`, `DELETE /api/mobile/izin/{id}`, `GET /api/mobile/izin/today`.

### 6. Persetujuan Izin (`/persetujuan`)

Untuk pengguna dengan posisi yang terlibat dalam alur persetujuan:
- **Menunggu Persetujuan Saya** — daftar pengajuan dengan tahap aktif, data pemohon (nama, NIP, unit), jenis, rentang tanggal, lama hari kerja, alamat, alasan + lampiran; persetuju dapat menulis **catatan** lalu **Setujui / Tolak** (dengan modal konfirmasi).
- **Riwayat Keputusan Saya** — daftar keputusan yang pernah diambil beserta putusan, catatan, dan waktunya.

API: `GET /api/mobile/izin/detail`, `GET /api/mobile/izin/riwayat-persetujuan`, `POST /api/mobile/izin/proses`.

### 7. Lembur (`/lembur`)

- **Banner konfigurasi** dari backend: batas jam pengajuan sebelum jam mulai, durasi maksimal per hari, dan jumlah hari ke depan yang diizinkan.
- **Form pengajuan**: tanggal (rentang dibatasi konfigurasi), jam mulai & jam selesai (validasi urutan dan durasi maksimal), keterangan (maks 1000 karakter), dengan pratinjau durasi.
- **Pengajuan Disetujui & Absen Lembur**: pilih tanggal yang sudah disetujui → tombol **Absen Masuk Lembur** / **Absen Pulang Lembur** (menuju `/absen-lembur/masuk|pulang?tanggal=...`), menampilkan waktu absen dan bintang.
- **Riwayat pengajuan**: tanggal, jam, durasi, keterangan, catatan keputusan, data absen (masuk/pulang + bintang), status, dan pembatalan bila masih `Menunggu`.

API: `GET /api/mobile/lembur`, `POST /api/mobile/lembur`, `DELETE /api/mobile/lembur/{id}`, `GET /api/mobile/absen-lembur/status`.

### 8. Persetujuan Lembur (`/persetujuan-lembur`)

Mirip persetujuan izin, untuk pengajuan lembur: daftar **menunggu persetujuan** (dengan catatan + Setujui/Tolak) dan **riwayat keputusan**.

API: `GET /api/mobile/lembur/menunggu`, `GET /api/mobile/lembur/riwayat-persetujuan`, `POST /api/mobile/lembur/proses`.

### 9. Logbook (`/logbook`)

Halaman dengan **2 tab**:

#### a. Entri Manual
- **LogBookForm** — formulir multi-baris (tambah/hapus baris). Setiap baris berisi tanggal, jam (HH:MM), dan isi aktivitas. Simpan bulk ke `POST /api/mobile/logbook/simpan-bulk` (maks 100 entri/request, isi maks 1000 karakter). Memiliki **Template**: buka modal (`LogBookTemplateModal`) untuk menyimpan, mengubah, menghapus, dan menerapkan template ke baris form.
- **LogBookRiwayat** — riwayat entri dengan pencarian teks, filter bulan & tahun, tombol **edit** dan **hapus** (entri yang **sudah diverifikasi** tidak dapat diubah/dihapus). API: `GET /api/mobile/logbook`, `POST /api/mobile/logbook/ubah`, `DELETE /api/mobile/logbook/{id}`, `GET/POST/DELETE /api/mobile/logbook/template...`.

#### b. Ambil dari SIMRS
- Mengambil aktivitas kerja dari **sistem SIMRS** untuk tanggal yang dipilih secara massal lalu mengimpornya ke logbook.
- Pilihan **jenis data**: Gabungan (Tindakan & Laboratorium), Tindakan, atau Lab.
- Rentang tanggal default **7 hari terakhir**, ada preset cepat **7 hari** dan **bulan ini**; bisa diatur manual `dari`–`sampai`.
- Tombol **Muat Data** memanggil `GET /api/mobile/logbook/simrs` (atau `/logbook/simrs/{jenis}`). Menampilkan ringkasan `N aktivitas · X tindakan · Y lab`, daftar entri (tanggal, jam, isi) dengan **checkbox pilih** dan tombol **pilih semua**.
- Tombol **Import N ke Logbook** mengimpor entri yang dicentang via `POST /api/mobile/logbook/simpan-bulk` (dipotong per chunk 100), lalu otomatis kembali ke tab **Entri Manual** dan me-refresh riwayat.
- Handling error: jika akun belum ter-mapping SIMRS atau koneksi SIMRS gagal, muncul banner peringatan/merah dengan pesan dari backend (tetap HTTP 200 dengan `sukses: false`).

---

## Route

| Path                  | Halaman                                              | Proteksi     |
| --------------------- | ---------------------------------------------------- | ------------ |
| `/login`              | Halaman login (SIMARO)                               | Guest only   |
| `/register`           | Halaman registrasi pegawai baru                      | Guest only   |
| `/`                   | Dashboard beranda                                    | Login        |
| `/present/:type`      | Flow absen masuk/pulang (`type` = `masuk`/`pulang`)  | Login        |
| `/izin/`              | Ajukan izin/sakit/cuti/dinas luar + riwayat          | Login        |
| `/persetujuan`        | Persetujuan izin (menunggu + riwayat keputusan)      | Login        |
| `/lembur`             | Ajukan lembur + absen lembur + riwayat               | Login        |
| `/absen-lembur/:tipe` | Absen lembur masuk/pulang (`tipe` = `masuk`/`pulang`) | Login        |
| `/persetujuan-lembur` | Persetujuan lembur (menunggu + riwayat keputusan)    | Login        |
| `/logbook`            | Logbook — tab Entri Manual & Ambil dari SIMRS        | Login        |

Router di `src/routes/AppRoutes.tsx`: rute publik dibungkus `GuestRoute`, rute ber-login dibungkus `ProtectedRoutes`. `ProtectedRoutes` mengandalkan `AuthContext` (token cookie `auth_token`; saat menerima 401, otomatis dialihkan ke `/login`).

---

## Struktur Proyek

```
src/
├── pages/                     # Halaman utama
│   ├── ClientPage.tsx         # Dashboard
│   ├── PresentPage.tsx        # Flow absen masuk/pulang
│   ├── AbsenLemburPage.tsx    # Flow absen lembur
│   ├── IzinPage.tsx           # Pengajuan & riwayat izin
│   ├── LemburPage.tsx         # Pengajuan & absen lembur
│   ├── LogbookPage.tsx        # Logbook (tabs manual + SIMRS)
│   ├── PendingLeave.tsx       # Persetujuan izin
│   ├── PersetujuanLembur.tsx  # Persetujuan lembur
│   ├── LoginPage.tsx          # Login
│   └── RegisterPage.tsx       # Registrasi
├── components/
│   ├── Client Page/           # Dashboard: TopNavbar, HeroCard, Absensi,
│   │                          #   LogBookSection, SifSection, PerformaBanner,
│   │                          #   PresentStatistic, RecentPresents
│   ├── Present Page/          # StepWizard, ValidateLocation, ValidateSelfie,
│   │                          #   ConfirmPresent(, ConfirmAbsenLembur)
│   ├── Logbook Page/          # LogBookForm, LogBookRiwayat, LogBookEditModal,
│   │                          #   LogBookTemplateModal, LogBookSimrs
│   ├── ProtectedRoutes.tsx    # Pembatas route ber-login
│   ├── GuestRoute.tsx         # Pembatas route publik
│   └── ConfirmModal.tsx       # Modal konfirmasi reusable
├── context/
│   └── AuthContext.tsx        # State user, lokasi, login/logout, isDokter
├── hooks/
│   ├── useTodaySession.ts     # Multi-sesi absen dokter hari ini
│   ├── useLoading.ts
├── routes/
│   └── AppRoutes.tsx          # Definisi seluruh rute
├── types/                     # Delegasi tipe (LogBookType, LemburType, dst.)
├── utils/
│   ├── api/                   # Axios instance + fungsi API per modul
│   │   ├── client.ts          # baseURL /api/mobile, interceptor 401
│   │   ├── Authentication.ts  # login/register/master/me/logout
│   │   ├── Attendence.ts      # absen/status/riwayat/statistik/performa/jadwal
│   │   ├── Leave.ts           # izin (CRUD, persetujuan, riwayat)
│   │   ├── Lembur.ts          # lembur + absen lembur
│   │   └── LogBook.ts         # logbook + template + SIMRS
│   ├── GeoLocation.ts         # Haversine, target koordinat, radius
│   ├── DateUtils.ts           # Sapaan & format tanggal
│   ├── LogBookHelpers.ts      # Bantuan entri logbook
│   └── Storage.ts
```

---

## Cara Menjalankan

```bash
npm install
npm run dev
```

Saat mode `dev`, semua request `/api/*` di-proxy otomatis ke `VITE_API_URL` (`vite.config.ts`). Jadi aplikasi cukup mengakses `/api/mobile/...` relatif.

### Build produksi

```bash
npm run build     # tsc -b && vite build → folder dist/
npm run preview   # pratinjau hasil build
```

### Lint

```bash
npm run lint
```

---

## Konfigurasi

Buat file `.env` di root `Absensi-rsud`:

```env
VITE_API_URL=http://localhost:8000   # URL backend Laravel (proxy dev & arah build)
```

- **API client** (`src/utils/api/client.ts`) memakai `baseURL: "/api/mobile"` dengan `withCredentials: true` (token dikirim via cookie `auth_token`).
- Saat respons API berstatus **401**, otomatis diarahkan ke `/login`.
- **Proxy dev** (`vite.config.ts`): `"/api"` → `VITE_API_URL` dengan `changeOrigin`.
- **GeoLocation** (`src/utils/GeoLocation.ts`): `TARGET_LAT`/`TARGET_LNG`/`MAX_DISTANCE` menentukan pusat & radius validasi absen (klien). Nilai server yang berlaku adalah yang dikonfigurasi di backend.

---

## Catatan

- Frontend ini bergantung pada `backend-absensi` (Laravel) untuk seluruh endpoint `/api/mobile`. Tanpa backend yang berjalan, login dan seluruh fitur tidak berfungsi.
- Bahasa UI: **Indonesia**. Zona waktu aktif: **Asia/Jayapura (WIT)**.