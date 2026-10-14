# Design Doc — Notifikasi Push (Web Push) SIMARO/MARO

- **Tanggal:** 2026-10-12
- **Status:** Disetujui (Opsi A) — menunggu review spec
- **Repo frontend:** `C:\Users\rogrs\OneDrive\Desktop\Absensi rsud` (React 19 + TypeScript + Vite 8)
- **Repo backend:** `C:\Users\rogrs\OneDrive\Desktop\backend-absensi` (Laravel 13, PHP 8.3)
- **Keputusan terkunci:**
  1. Kerjakan kedua repo (frontend + backend).
  2. Ikon PNG dihasilkan otomatis dari `favicon.svg` via `@resvg/resvg-js`.
  3. Kontrol "Aktifkan notifikasi HP" hanya di dropdown lonceng.
  4. Push dikirim untuk **semua** kategori notifikasi (semua yang lewat `buat_notifikasi()`).
  5. Pengirim server memakai paket **`laravel-notification-channels/webpush`** (Opsi A).

---

## 1. Ringkasan

Menambahkan **Web Push** sehingga pegawai menerima notifikasi **di HP walau aplikasi web ditutup**, untuk semua notifikasi in-app yang sudah ada. Tidak perlu membangun APK/native app: notifikasi tampil di system tray seperti app native. Di Android cukup lewat Chrome (install PWA opsional); di iOS wajib "Add to Home Screen" (Safari 16.4+).

## 2. Latar Belakang & Masalah

Saat ini notifikasi hanya in-app (lonceng + polling 60 detik saat tab terlihat, lihat `src/hooks/useNotifications.ts`). Pegawai tidak diberi tahu saat app tertutup, sehingga persetujuan izin/lembur/jadwal bisa terlewat.

**Fakta arsitektur penting:** Node.js/Vite hanyalah penyaji file statis + menjalankan React di browser. Semua logika bisnis dan sumber kejadian notifikasi ada di Laravel (`dvlp-absen.rsud-merauke.id`), diakses browser via `/api/mobile` (lihat `vite.config.ts` proxy `/api`). Karena itu **pengirim push wajib berada di server Laravel**; browser/SPA tidak bisa mengirim push saat ditutup.

## 3. Tujuan & Metrik Keberhasilan

- Notifikasi tiba saat app **tertutup** (Android Chrome + iOS PWA terinstall).
- Cakupan: **semua** notifikasi yang dibuat lewat `buat_notifikasi()`.
- Metrik: notifikasi uji tiba < 30 detik dari trigger; langganan gagal/kedaluwarsa (404/410) otomatis dibersihkan.
- Tidak perlu build APK / publish ke store.

## 4. Ruang Lingkup

**In-scope:**
- Langganan push per perangkat (bisa >1 per user).
- Pengiriman push dari satu titik: `buat_notifikasi()`.
- Klik notifikasi → buka/fokus halaman terkait.
- Unsubscribe saat logout.
- PWA manifest + ikon + `<head>`.
- Panduan iOS (Add to Home Screen).

**Out-of-scope:**
- Native app / APK.
- Kanal selain Web Push (SMS/WhatsApp/email).
- Notifikasi saat app tertutup tanpa izin user.
- Integrasi vendor pihak ketiga (OneSignal/Beams/FCM custom).

## 5. Pengguna & Use Case

- **Pegawai:** menerima notifikasi pengajuan/jadwal/keamanan meski app tertutup.
- **Pejabat (approver):** diberi tahu ada pengajuan menunggu.
- **Semua:** klik notifikasi → langsung ke halaman aksi.

## 6. Arsitektur

```
Aktifkan (user gesture)
  → Notification.requestPermission()
  → reg.pushManager.subscribe(VAPID public key)
  → POST /api/mobile/push/subscribe  → tabel push_subscriptions

buat_notifikasi()  (app/Helpers/absensi.php)
  → Notifikasi::create(...)
  → $user->notify(new PushNotifikasi(...))   [ShouldQueue]
      → queue worker → WebPushChannel (VAPID) → FCM/APNs
          → Service Worker 'push' → showNotification
              → klik → clients.openWindow/focus(url)

Logout (AuthProvider)
  → sub.unsubscribe() + POST /api/mobile/push/unsubscribe
```

Tiga komponen utama:
1. **Frontend SW** (`public/sw.js`) — penerima push (same-origin, disajikan dari domain sendiri).
2. **Backend Laravel** — penyimpan langganan + pengirim push (VAPID).
3. **Queue worker** — eksekusi pengiriman async.

## 7. Kebutuhan Fungsional

| ID | Kebutuhan |
|----|-----------|
| F1 | User dapat mengaktifkan notifikasi push (izin + langganan). |
| F2 | Langganan tersimpan per perangkat, bisa lebih dari satu per user. |
| F3 | Setiap `buat_notifikasi()` mengirim push ke user tersebut. |
| F4 | Klik notifikasi membuka/fokus tab dan navigasi ke `url` terkait. |
| F5 | Logout menghapus langganan perangkat itu. |
| F6 | Langganan kedaluwarsa (404/410) dihapus otomatis oleh paket. |
| F7 | iOS: hanya saat PWA di-Add to Home Screen; sediakan panduan. |
| F8 | Bila browser tak mendukung, kontrol push disembunyikan. |

## 8. Kebutuhan Non-Fungsional

- Pengiriman push **async** (queue) agar tidak memperlambat request HTTP.
- Payload ≤ 4 KB; `isi` pendek, `url` dikirim via `data`.
- Kunci VAPID stabil; `VAPID_SUBJECT` valid (wajib untuk iOS/Apple).
- HTTPS aktif; SW disajikan di `/sw.js` (same-origin).
- Push gagal **tidak boleh** menggagalkan pembuatan notifikasi in-app.

## 9. Kontrak API (prefix `/api/mobile`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/push/key` | tidak | — | `{sukses, key}` |
| POST | `/push/subscribe` | `mobile.auth` | `{endpoint, keys:{p256dh, auth}}` | `{sukses, pesan}` |
| POST | `/push/unsubscribe` | `mobile.auth` | `{endpoint}` | `{sukses, pesan}` |

Auth memakai middleware `mobile.auth` (`app/Http/Middleware/CheckMobileAuth.php`) yang membaca cookie `auth_token` dan menaruh user di `$req->get('user')`.

---

## 10. Perubahan Backend (`backend-absensi`)

### 10.1 Dependensi & publikasi
```bash
composer require laravel-notification-channels/webpush
php artisan vendor:publish --provider="NotificationChannels\WebPush\WebPushServiceProvider" --tag="config"
php artisan vendor:publish --provider="NotificationChannels\WebPush\WebPushServiceProvider" --tag="migrations"
php artisan webpush:vapid
php artisan migrate
php artisan config:clear
```

### 10.2 `.env` (dan `.env.example`)
```env
VAPID_PUBLIC_KEY=        # diisi otomatis oleh webpush:vapid
VAPID_PRIVATE_KEY=       # diisi otomatis oleh webpush:vapid
VAPID_SUBJECT="mailto:admin@rsud-merauke.id"
```

### 10.3 `app/Models/User.php`
```php
use Illuminate\Notifications\Notifiable;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;
    use HasPushSubscriptions;
    // ...sisanya tetap
}
```

### 10.4 `app/Http/Controllers/Api/PushSubscriptionController.php` (baru)
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function key(): JsonResponse
    {
        return response()->json([
            'sukses' => true,
            'key' => config('webpush.vapid.public_key'),
        ]);
    }

    public function subscribe(Request $req): JsonResponse
    {
        $user = $req->get('user');

        $data = $req->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
            'content_encoding' => ['nullable', 'string'],
        ]);

        $user->updatePushSubscription(
            $data['endpoint'],
            $data['keys']['p256dh'],
            $data['keys']['auth'],
            $data['content_encoding'] ?? null,
        );

        return response()->json(['sukses' => true, 'pesan' => 'Langganan notifikasi disimpan.']);
    }

    public function unsubscribe(Request $req): JsonResponse
    {
        $user = $req->get('user');
        $data = $req->validate(['endpoint' => ['required', 'string']]);

        $user->deletePushSubscription($data['endpoint']);

        return response()->json(['sukses' => true, 'pesan' => 'Langganan notifikasi dihapus.']);
    }
}
```

### 10.5 `app/Notifications/PushNotifikasi.php` (baru)
```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class PushNotifikasi extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param array<string, mixed> $data */
    public function __construct(
        public string $judul,
        public string $isi,
        public array $data = [],
    ) {}

    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->judul)
            ->body($this->isi)
            ->icon('/icon-192.png')
            ->badge('/icon-192.png')
            ->data($this->data)
            ->options(['TTL' => 3600]);
    }
}
```

### 10.6 `routes/api.php`
```php
use App\Http\Controllers\Api\PushSubscriptionController;

Route::prefix('mobile')->group(function () {
    // ...route lama...

    Route::get('push/key', [PushSubscriptionController::class, 'key']);

    Route::middleware('mobile.auth')->group(function () {
        // ...route lama...

        Route::post('push/subscribe', [PushSubscriptionController::class, 'subscribe']);
        Route::post('push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);
    });
});
```

### 10.7 `app/Helpers/absensi.php` — hook di `buat_notifikasi()`
```php
use App\Models\User;                       // tambahkan di blok use atas
use App\Notifications\PushNotifikasi;      // tambahkan di blok use atas

// di dalam buat_notifikasi(), setelah Notifikasi::create:
$baris = Notifikasi::create([
    'user_id' => $userId,
    'isi' => trim($isi),
    'is_read' => false,
    'url' => $url,
    'tipe' => in_array($tipe, Notifikasi::TIPE, true) ? $tipe : 'info',
    'kategori' => $kategori,
]);

try {
    $penerima = User::find($userId);
    if ($penerima) {
        $penerima->notify(new PushNotifikasi(
            Notifikasi::KATEGORI[$kategori] ?? 'Notifikasi',
            trim($isi),
            [
                'id' => (int) $baris->id,
                'url' => $url,
                'kategori' => $kategori,
                'isi' => trim($isi),
            ],
        ));
    }
} catch (\Throwable $e) {
    report($e); // push gagal tidak boleh menggagalkan notifikasi in-app
}

return (int) $baris->id;
```

> Catatan: `buat_notifikasi_banyak()` (baris ~148) memanggil `buat_notifikasi()` per user, sehingga otomatis ikut ter-cover.

---

## 11. Perubahan Frontend (repo ini)

### 11.1 `public/sw.js` (tulis ulang)
Handler `push` + `notificationclick` + `petaUrlNotif`.
```js
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function petaUrlNotif(data) {
  if (!data) return "/";
  if (data.kategori === "password") return "/profile";
  const url = data.url;
  if (!url || url.startsWith("admin/")) return "/";
  if (url === "lembur") return "/lembur";
  if (url === "ubah-jadwal") return "/ubah-jadwal";
  if (url === "persetujuan") {
    const teks = String(data.isi || "").toLowerCase();
    if (teks.includes("lembur")) return "/persetujuan-lembur";
    if (teks.includes("jadwal")) return "/persetujuan-jadwal";
    return "/persetujuan";
  }
  return url.startsWith("/") ? url : `/${url}`;
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const data = payload.data || {};
  const title = payload.title || "Notifikasi";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || data.isi || "",
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/icon-192.png",
      data: { url: petaUrlNotif(data) },
      tag: data.id ? `notif-${data.id}` : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
```

### 11.2 `public/manifest.webmanifest` (baru)
```json
{
  "name": "MARO — Monitoring Absensi RSUD Online",
  "short_name": "MARO",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e9a48",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 11.3 `index.html` (tambahkan di `<head>`)
```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#1e9a48" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MARO" />
```

### 11.4 `src/main.tsx` — sudah ada, pertahankan
```tsx
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
```

### 11.5 `src/utils/api/Notification.ts` — tambahkan
```ts
export const getPushKey = async () => {
  const res = await api.get("/push/key");
  return (await res).data;
};

export const subscribePush = async (sub: PushSubscriptionJSON) => {
  const res = await api.post("/push/subscribe", sub);
  return (await res).data;
};

export const unsubscribePush = async (endpoint: string) => {
  const res = await api.post("/push/unsubscribe", { endpoint });
  return (await res).data;
};
```

### 11.6 `src/utils/WebPush.ts` (baru)
```ts
import { unsubscribePush } from "./api/Notification";

export function dukungWebPush(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;

  const ua = window.navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const standalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isIos && !standalone) return false;

  return true;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Lepas langganan perangkat ini (dipanggil saat logout). */
export async function matikanPush(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await unsubscribePush(endpoint).catch(() => {});
  } catch {
    // jangan gagalkan logout
  }
}
```

### 11.7 `src/hooks/usePushNotifications.ts` (baru)
```ts
import { useCallback, useEffect, useState } from "react";
import { getPushKey, subscribePush } from "../utils/api/Notification";
import { dukungWebPush, matikanPush, urlBase64ToUint8Array } from "../utils/WebPush";

export default function usePushNotifications() {
  const [didukung] = useState(() => dukungWebPush());
  const [aktif, setAktif] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  const cekStatus = useCallback(async () => {
    if (!didukung) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setAktif(Boolean(sub) && Notification.permission === "granted");
    } catch {
      setAktif(false);
    }
  }, [didukung]);

  useEffect(() => {
    void cekStatus();
  }, [cekStatus]);

  const aktifkan = useCallback(async () => {
    if (!didukung) return false;
    setSibuk(true);
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { key } = await getPushKey();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
      }

      await subscribePush(sub.toJSON());
      setAktif(true);
      return true;
    } catch {
      return false;
    } finally {
      setSibuk(false);
    }
  }, [didukung]);

  const nonaktifkan = useCallback(async () => {
    setSibuk(true);
    try {
      await matikanPush();
      setAktif(false);
    } finally {
      setSibuk(false);
    }
  }, []);

  return { didukung, aktif, sibuk, aktifkan, nonaktifkan };
}
```

### 11.8 `src/hooks/useNotifications.ts` — kembalikan ke versi semula
Buang penambahan Solusi A (polling yang memicu notifikasi OS / `lastIdRef`). Fungsi tetap: ambil daftar, badge, mark read/all, polling 60 detik saat tab terlihat.

### 11.9 `src/components/NotificationBell.tsx` — ganti kontrol
Hapus import/keadaan lama (`OsNotification`). Tambahkan:
```tsx
import usePushNotifications from "../hooks/usePushNotifications";
// ...
const { didukung, aktif, sibuk, aktifkan, nonaktifkan } = usePushNotifications();
```
Dan ganti tombol lama dengan:
```tsx
{didukung && (
  <button
    type="button"
    disabled={sibuk}
    onClick={aktif ? nonaktifkan : aktifkan}
    className="flex w-full items-center justify-center gap-2 border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60">
    <IoIosNotificationsOutline size={16} />
    {aktif ? "Nonaktifkan notifikasi HP" : "Aktifkan notifikasi HP"}
  </button>
)}
```
`mapNotifUrl` tetap diimpor dari `src/utils/NotifUrl.ts` untuk klik item in-app.

### 11.10 `src/context/AuthProvider.tsx` — unsubscribe saat logout
```ts
import { matikanPush } from "../utils/WebPush";
// ...
const logout = async () => {
  await matikanPush();      // lepas langganan perangkat ini dulu
  await apiLogout();
  setUser(null);
  navigate("/login");
};
```

### 11.11 Hapus bagian Solusi A
- Hapus file `src/utils/OsNotification.ts`.
- Revert `src/hooks/useNotifications.ts` (lihat 11.8).
- `src/utils/NotifUrl.ts` **dipertahankan** (dipakai klik item in-app).

---

## 12. Ikon & PWA (generate dari `favicon.svg`)

### 12.1 `scripts/gen-icons.mjs` (baru)
```js
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/favicon.svg"), "utf8");

const targets = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  const resvg = new Resvg(svg, {
    background: "#ffffff",
    fitTo: { mode: "width", value: size },
  });
  writeFileSync(join(root, file), resvg.render().asPng());
  console.log(`OK ${file} (${size}px)`);
}
```

### 12.2 Instruksi
```bash
npm i -D @resvg/resvg-js
npm run icons
```
Tambahkan `"icons": "node scripts/gen-icons.mjs"` di `package.json`. Latar putih (`background`) mencegah iOS menempelkan latar hitam pada ikon transparan. Sumber: `public/favicon.svg` (viewBox `0 0 3544 3544`).

---

## 13. Konfigurasi & Operasional

- **Produksi wajib menjalankan queue worker:** `php artisan queue:work --tries=3` (supervisor/systemd).
- `.env` produksi: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (domain/mailto valid), `APP_URL` benar.
- HTTPS aktif; SW tersaji di `/sw.js`.
- Jangan regenerate kunci VAPID setelah live (langganan lama akan batal).
- `QUEUE_CONNECTION=database` (sudah) + jalankan worker.

## 14. Rencana Pengujian

**Backend (`php artisan test`):**
- `GET /api/mobile/push/key` mengembalikan kunci publik.
- `POST /push/subscribe` tanpa cookie → 401; dengan cookie → tersimpan di `push_subscriptions`.
- `Notification::fake()`: memanggil `buat_notifikasi()` mengirim `PushNotifikasi` ke user yang benar.

**Frontend:**
- `npm run lint`, `npx tsc -b`, `npm run build`.

**Manual E2E:**
1. Android Chrome (atau iOS PWA): aktifkan izin → **tutup browser** → trigger `buat_notifikasi()` (tinker) → push tiba; klik → halaman terkait.
2. iOS Safari 16.4+: Add to Home Screen → izin → uji sama.
3. Logout → baris `push_subscriptions` untuk endpoint tersebut hilang.
4. Simulasi langganan kedaluwarsa → terhapus otomatis (404/410).

**Uji SW tanpa backend (dev):** Chrome DevTools → Application → Service Workers → tombol **Push** dengan payload `{"title":"Uji","body":"Halo","data":{"id":1,"url":"/lembur"}}`. (Catatan: tombol Push butuh tab terbuka; skenario app tertutup menunggu backend.)

**Secure context:** `localhost` (desktop) atau `adb reverse tcp:5173 tcp:5173` (Android). IP LAN http bukan secure context.

## 15. Acceptance Criteria

- [ ] Notifikasi tiba saat app tertutup (Android & iOS PWA).
- [ ] Semua notifikasi lama tetap ter-push via `buat_notifikasi()`.
- [ ] Klik mengarah ke halaman sesuai `url`.
- [ ] Logout melepas langganan perangkat.
- [ ] Tidak ada notifikasi ganda.
- [ ] Push gagal tidak menggagalkan notifikasi in-app.
- [ ] `lint` / `tsc` / `build` hijau.

## 16. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Queue worker mati | Supervisor + monitor; kirim async |
| Kunci VAPID berubah | Simpan aman, jangan regenerate |
| iOS butuh install | Panduan "Add to Home Screen" |
| `VAPID_SUBJECT` kosong → Apple tolak | Set mailto valid |
| Duplikasi mapping URL (`NotifUrl.ts` vs `sw.js`) | Komentar sinkron; uji berkala |
| SW versi lama ter-cache | `skipWaiting()` + `clients.claim()` (sudah) |

## 17. Panduan Implementasi (urutan)

1. Backend: install paket → publish → `webpush:vapid` → set `VAPID_SUBJECT` → migrate → config:clear.
2. Backend: trait User → controller → notification → route → hook `buat_notifikasi()`.
3. Backend: jalankan queue worker; uji endpoint & `Notification::fake()`.
4. Frontend: `sw.js`, manifest, `index.html`, `WebPush.ts`, API, hook, bell, AuthProvider (logout).
5. Frontend: ikon (`npm run icons`).
6. Bersihkan Solusi A (`OsNotification.ts` hapus, `useNotifications.ts` revert).
7. `npm run lint && npx tsc -b && npm run build`.
8. Uji E2E (Android + iOS) & tutup browser.
9. README diperbarui (fitur + cara uji).

## 18. Troubleshooting

- Tombol tak muncul → `dukungWebPush()` false (iOS belum install / bukan HTTPS).
- Izin `denied` → reset di setelan situs.
- Push tak tiba → cek queue worker, `push_subscriptions` terisi, VAPID sama, `VAPID_SUBJECT` valid.
- Klik tak navigasi → cek `data.url` di payload & `petaUrlNotif`.
- `applicationServerKey` error → pastikan `urlBase64ToUint8Array` benar.
