# SIAPPS — Sistem Absensi

Aplikasi absensi berbasis web dengan validasi GPS dan foto selfie.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool
- **Tailwind CSS 4** — styling
- **React Router 8** — routing
- **Leaflet** — peta OpenStreetMap
- **react-icons** — ikon

## Fitur

- **Absen Masuk & Pulang** — dibedakan via URL (`/present/masuk` / `/present/pulang`)
- **Validasi GPS** — mendeteksi lokasi pengguna, hitung jarak ke target menggunakan rumus Haversine
- **Peta Interaktif** — menampilkan lokasi pengguna di peta OpenStreetMap (Leaflet)
- **Foto Selfie** — mengambil foto dari kamera depan via `getUserMedia`
- **3-Step Wizard** — Lokasi → Selfie → Konfirmasi
- **Penyimpanan Lokal** — data absensi disimpan di `localStorage`

## Route

| Path              | Halaman                                                     |
| ----------------- | ----------------------------------------------------------- |
| `/`               | Beranda (sapaan, status absen hari ini, statistik, riwayat) |
| `/present/masuk`  | Flow absen masuk                                            |
| `/present/pulang` | Flow absen pulang                                           |

## Cara Menjalankan

```bash
npm install
npm run dev
```

## Konfigurasi

Target koordinat dan jarak maksimum ada di `src/utils/GeoLocation.ts`:

```ts
TARGET_LAT = -8.507868816179423;
TARGET_LNG = 140.40432736389988;
MAX_DISTANCE = 100; // meter
```
