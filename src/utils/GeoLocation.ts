// Target coordinate — fallback jika konfigurasi lokasi backend belum termuat
export const TARGET_LAT = -8.481854592633615;
export const TARGET_LNG = 140.38878299611167;
export const MAX_DISTANCE = 500;

/** Batas akurasi GPS maksimum (meter) agar tidak menerima posisi kasar menara seluler. */
export const MAX_ACCEPTABLE_ACCURACY = 150;

/** Batas lompatan jarak antar sampel beruntun (meter) yang dianggap anomali teleportasi. */
export const MAX_SAMPLE_JUMP_METERS = 150;

/** Masa berlaku koordinat sebelum perlu validasi ulang otomatis saat konfirmasi (ms). */
export const LOCATION_FRESH_MS = 120_000;

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
  tamperingReasons: string[];
  suspiciousReasons: string[];
};

type CleanIntrinsics = {
  fnToString: typeof Function.prototype.toString;
  getOwnPropDesc: typeof Object.getOwnPropertyDescriptor;
  cleanup: () => void;
};

/**
 * Ambil Function.prototype.toString & Object.getOwnPropertyDescriptor asli dari
 * iframe about:blank yang bersih agar tidak bisa dikelabui oleh ekstensi yang
 * ikut mem-patch Function.prototype.toString di window utama.
 */
function getCleanIntrinsics(): CleanIntrinsics {
  if (typeof document !== "undefined" && document.documentElement) {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.setAttribute("aria-hidden", "true");
      document.documentElement.appendChild(iframe);
      const win = iframe.contentWindow as
        | (Window & {
            Function: FunctionConstructor;
            Object: ObjectConstructor;
          })
        | null;
      if (win?.Function?.prototype?.toString && win?.Object?.getOwnPropertyDescriptor) {
        return {
          fnToString: win.Function.prototype.toString,
          getOwnPropDesc: win.Object.getOwnPropertyDescriptor,
          cleanup: () => {
            try {
              iframe.remove();
            } catch {
              // abaikan
            }
          },
        };
      }
      iframe.remove();
    } catch {
      // fallback ke window utama
    }
  }
  return {
    fnToString: Function.prototype.toString,
    getOwnPropDesc: Object.getOwnPropertyDescriptor,
    cleanup: () => {},
  };
}

function isNativeFunction(
  fn: unknown,
  cleanFnToString: typeof Function.prototype.toString,
): boolean {
  if (typeof fn !== "function") return false;
  let src: string;
  try {
    src = cleanFnToString.call(fn).trim();
  } catch {
    try {
      src = Function.prototype.toString.call(fn).trim();
    } catch {
      // Beberapa WebView/Safari mobile dapat menolak cross-realm toString pada objek WebIDL asli.
      return true;
    }
  }
  // Terima format Chrome/Firefox (`function getCurrentPosition() { [native code] }`,
  // `function get latitude() { [native code] }`) maupun WebKit/iOS Safari yang kadang
  // menuliskan getter native tanpa nama (`function () { [native code] }`).
  return /^function\s*(?:(?:get\s+)?[\w$]+)?\s*\([^)]*\)\s*\{\s*\[native code\]\s*\}$/.test(
    src,
  );
}

type NativeCtor = { prototype: object };

function getWindowCtor(name: string): NativeCtor | undefined {
  const val = (window as unknown as Record<string, unknown>)[name];
  return typeof val === "function" ? (val as unknown as NativeCtor) : undefined;
}

/**
 * Deteksi manipulasi / monkey-patch pada Geolocation API oleh ekstensi browser
 * (seperti Location Changer, Location Guard, Spoof Geolocation, dll.).
 *
 * Dirancang aman untuk seluruh browser mobile (iOS Safari/WebKit, Chrome Android,
 * Samsung Internet, MIUI, WebView): hanya memblokir jika terdeteksi fungsi JS
 * non-native yang menimpa implementasi bawaan browser.
 */
export function detectGeolocationTampering(): string[] {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return [];
  }
  const geo = navigator.geolocation;
  if (!geo) return [];

  const reasons: string[] = [];
  const { fnToString, getOwnPropDesc, cleanup } = getCleanIntrinsics();

  try {
    // 1. Cek apakah Function.prototype.toString di window utama ikut dimodifikasi oleh ekstensi
    if (!isNativeFunction(Function.prototype.toString, fnToString)) {
      reasons.push("Fungsi bawaan browser (Function.toString) telah dimodifikasi.");
    }

    // 2. Cek apakah navigator.geolocation diganti objek palsu atau metode prototipenya di-patch
    const GeoCtor = getWindowCtor("Geolocation");
    if (GeoCtor) {
      try {
        if (!(geo instanceof (GeoCtor as unknown as new () => object))) {
          reasons.push("Objek navigator.geolocation bukan instance native browser.");
        }
      } catch {
        // abaikan jika browser tidak mendukung instanceof pada host object
      }

      const proto = GeoCtor.prototype as Geolocation;
      for (const method of ["getCurrentPosition", "watchPosition", "clearWatch"] as const) {
        if (typeof proto[method] === "function" && !isNativeFunction(proto[method], fnToString)) {
          reasons.push(`Geolocation.prototype.${method} terdeteksi dimodifikasi.`);
        }
      }
    }

    // 3. Cek metode aktif pada navigator.geolocation (harus tetap native code)
    for (const method of ["getCurrentPosition", "watchPosition", "clearWatch"] as const) {
      if (!isNativeFunction(geo[method], fnToString)) {
        reasons.push(`Fungsi GPS ${method} bukan implementasi asli browser.`);
      }
    }

    // 4. Cek getter geolocation pada navigator & Navigator.prototype
    const ownNavGeo = getOwnPropDesc(navigator, "geolocation");
    if (ownNavGeo?.get && !isNativeFunction(ownNavGeo.get, fnToString)) {
      reasons.push("Getter navigator.geolocation terdeteksi dimodifikasi.");
    }
    const NavCtor = getWindowCtor("Navigator");
    if (NavCtor) {
      const navGeoDesc = getOwnPropDesc(NavCtor.prototype, "geolocation");
      if (navGeoDesc?.get && !isNativeFunction(navGeoDesc.get, fnToString)) {
        reasons.push("Getter Navigator.prototype.geolocation terdeteksi dimodifikasi.");
      }
    }

    // 5. Cek getter GeolocationPosition & GeolocationCoordinates
    const PosCtor = getWindowCtor("GeolocationPosition");
    if (PosCtor) {
      for (const prop of ["coords", "timestamp"] as const) {
        const desc = getOwnPropDesc(PosCtor.prototype, prop);
        if (desc?.get && !isNativeFunction(desc.get, fnToString)) {
          reasons.push(`Getter GeolocationPosition.${prop} terdeteksi dimodifikasi.`);
        }
      }
    }

    const CoordsCtor = getWindowCtor("GeolocationCoordinates");
    if (CoordsCtor) {
      for (const prop of ["latitude", "longitude", "accuracy"] as const) {
        const desc = getOwnPropDesc(CoordsCtor.prototype, prop);
        if (desc?.get && !isNativeFunction(desc.get, fnToString)) {
          reasons.push(`Getter GeolocationCoordinates.${prop} terdeteksi dimodifikasi.`);
        }
      }
    }
  } finally {
    cleanup();
  }

  return Array.from(new Set(reasons));
}

/**
 * Verifikasi keaslian objek GeolocationPosition yang dikembalikan browser.
 * Ekstensi fake GPS yang membuat objek JS palsu tidak memiliki internal C++ slot
 * WebIDL sehingga akan gagal pada instanceof atau native getter invocation.
 */
export function inspectGeolocationPosition(pos: GeolocationPosition): string[] {
  if (typeof window === "undefined") return [];
  const reasons: string[] = [];
  const { getOwnPropDesc, cleanup } = getCleanIntrinsics();

  try {
    const PosCtor = getWindowCtor("GeolocationPosition");
    const CoordsCtor = getWindowCtor("GeolocationCoordinates");

    if (PosCtor) {
      let validInstance = true;
      try {
        validInstance = pos instanceof (PosCtor as unknown as new () => object);
      } catch {
        validInstance = true;
      }

      if (!validInstance) {
        reasons.push("Objek posisi GPS palsu (bukan GeolocationPosition asli).");
      } else {
        const coordsGetter = getOwnPropDesc(PosCtor.prototype, "coords")?.get;
        if (coordsGetter) {
          try {
            const nativeCoords = coordsGetter.call(pos) as GeolocationCoordinates | undefined;
            // Bandingkan nilai koordinat (bukan referensi objek) karena sebagian
            // WebKit/iOS Safari dapat membuat wrapper baru saat getter dipanggil.
            if (
              !nativeCoords ||
              !Object.is(nativeCoords.latitude, pos.coords.latitude) ||
              !Object.is(nativeCoords.longitude, pos.coords.longitude)
            ) {
              reasons.push("Properti coords pada posisi GPS telah ditimpa.");
            }
          } catch {
            reasons.push("Objek posisi GPS gagal verifikasi native browser.");
          }
        }
      }
    }

    if (CoordsCtor && pos.coords) {
      let validCoords = true;
      try {
        validCoords =
          pos.coords instanceof (CoordsCtor as unknown as new () => object);
      } catch {
        validCoords = true;
      }

      if (!validCoords) {
        reasons.push("Objek koordinat GPS palsu (bukan GeolocationCoordinates asli).");
      } else {
        for (const prop of ["latitude", "longitude", "accuracy"] as const) {
          const getter = getOwnPropDesc(CoordsCtor.prototype, prop)?.get;
          if (getter) {
            try {
              const nativeVal = getter.call(pos.coords);
              if (!Object.is(nativeVal, pos.coords[prop])) {
                reasons.push(`Nilai ${prop} pada koordinat GPS telah ditimpa.`);
              }
            } catch {
              reasons.push("Objek koordinat GPS gagal verifikasi native browser.");
              break;
            }
          }
        }
      }
    }
  } finally {
    cleanup();
  }

  return Array.from(new Set(reasons));
}

/**
 * Cek kontradiksi izin lokasi: browser melaporkan izin geolocation = denied,
 * tetapi callback GPS tetap berhasil mengembalikan koordinat (indikasi ekstensi fake GPS).
 */
export async function checkGeolocationPermissionDenied(): Promise<boolean> {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.permissions ||
      typeof navigator.permissions.query !== "function"
    ) {
      return false;
    }
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return status.state === "denied";
  } catch {
    return false;
  }
}

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

export function analyzeGpsSamples(
  samples: GpsSample[],
  tamperingReasons: string[] = [],
): ValidatedLocation {
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

  const uniqueTampering = Array.from(new Set(tamperingReasons));
  const suspiciousReasons: string[] = [...uniqueTampering];

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
    tamperingReasons: uniqueTampering,
    suspiciousReasons,
  };
}

export function getFreshPosition(timeout = 12_000): Promise<GpsSample> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Browser tidak mendukung GPS."));
      return;
    }

    const apiTampering = detectGeolocationTampering();
    if (apiTampering.length > 0) {
      reject(
        new Error(
          "Terdeteksi ekstensi/skrip Fake GPS pada browser. Nonaktifkan ekstensi pengubah lokasi lalu muat ulang halaman.",
        ),
      );
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const posTampering = inspectGeolocationPosition(pos);
      if (posTampering.length > 0) {
        reject(
          new Error(
            "Terdeteksi lokasi GPS tiruan dari ekstensi browser. Nonaktifkan ekstensi Fake GPS lalu coba lagi.",
          ),
        );
        return;
      }
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy * 100) / 100,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      });
    };

    const requestPosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          // Di dalam ruangan RSUD sebagian HP gagal lock GPS satelit; coba ulang mode fused/jaringan.
          if (highAccuracy && (err.code === 2 || err.code === 3)) {
            requestPosition(false);
            return;
          }
          const msg =
            err.code === 1
              ? "Izin lokasi ditolak."
              : err.code === 2
                ? "GPS tidak tersedia."
                : "Waktu permintaan GPS habis.";
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: highAccuracy ? 0 : 15_000,
        },
      );
    };

    requestPosition(true);
  });
}
