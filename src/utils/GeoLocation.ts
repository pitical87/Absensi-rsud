// Target coordinate — fallback jika konfigurasi lokasi backend belum termuat
export const TARGET_LAT = -8.481854592633615;
export const TARGET_LNG = 140.38878299611167;
export const MAX_DISTANCE = 500;

/** Batas akurasi GPS maksimum (meter) agar tidak menerima posisi kasar menara seluler. */
export const MAX_ACCEPTABLE_ACCURACY = 150;

/** Batas lompatan jarak antar sampel beruntun (meter) yang dianggap anomali teleportasi. */
export const MAX_SAMPLE_JUMP_METERS = 150;

/** Masa berlaku koordinat sebelum perlu validasi ulang otomatis saat konfirmasi (ms). */
export const LOCATION_FRESH_MS = 60_000;

export type GpsSample = {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  timestamp: number;
};

export type ValidatedLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: number;
  sampleCount: number;
  maxJumpMeters: number;
  isIdenticalSamples: boolean;
  suspiciousReasons: string[];
};

export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // dalam meter
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function analyzeGpsSamples(samples: GpsSample[]): ValidatedLocation {
  // Pilih sampel dengan akurasi terbaik (nilai meter terkecil)
  let best = samples[0];
  for (const s of samples) {
    if (s.accuracy < best.accuracy) {
      best = s;
    }
  }

  let maxJumpMeters = 0;
  for (let i = 1; i < samples.length; i++) {
    const jump = getDistance(
      samples[i - 1].lat,
      samples[i - 1].lng,
      samples[i].lat,
      samples[i].lng,
    );
    if (jump > maxJumpMeters) {
      maxJumpMeters = jump;
    }
  }

  const isIdenticalSamples =
    samples.length >= 2 &&
    samples.every(
      (s) =>
        s.lat === samples[0].lat &&
        s.lng === samples[0].lng &&
        s.accuracy === samples[0].accuracy,
    );

  const suspiciousReasons: string[] = [];

  if (best.accuracy > 0 && best.accuracy < 3) {
    suspiciousReasons.push(
      `Akurasi GPS terlalu presisi (±${best.accuracy.toFixed(1)} m).`,
    );
  }

  if (maxJumpMeters > MAX_SAMPLE_JUMP_METERS) {
    suspiciousReasons.push(
      `Terdeteksi lompatan koordinat mendadak (${Math.round(maxJumpMeters)} m) saat verifikasi GPS.`,
    );
  }

  if (samples.length >= 3 && isIdenticalSamples && best.accuracy <= 5) {
    suspiciousReasons.push(
      "Koordinat dan akurasi identik statis di seluruh sampel GPS.",
    );
  }

  return {
    lat: best.lat,
    lng: best.lng,
    accuracy: Math.round(best.accuracy * 100) / 100,
    capturedAt: Date.now(),
    sampleCount: samples.length,
    maxJumpMeters: Math.round(maxJumpMeters * 10) / 10,
    isIdenticalSamples,
    suspiciousReasons,
  };
}

export function getFreshPosition(timeout = 10_000): Promise<GpsSample> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser tidak mendukung GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy * 100) / 100,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Izin lokasi ditolak."
            : err.code === 2
              ? "GPS tidak tersedia."
              : "Waktu permintaan GPS habis.";
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 0,
      },
    );
  });
}
