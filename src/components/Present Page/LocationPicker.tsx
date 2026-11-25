import l from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useRef, useState } from "react";
import { CiLocationOn } from "react-icons/ci";
import { FiRefreshCw } from "react-icons/fi";
import { MdLocationOff } from "react-icons/md";
import {
  analyzeGpsSamples,
  checkGeolocationPermissionDenied,
  detectGeolocationTampering,
  formatDistance,
  getDistance,
  inspectGeolocationPosition,
  MAX_ACCEPTABLE_ACCURACY,
  MAX_SAMPLE_JUMP_METERS,
  type GpsSample,
  type ValidatedLocation,
} from "../../utils/GeoLocation";

delete (l.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
l.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TARGET_SAMPLES = 2;
const SAMPLE_WINDOW_MS = 2000;
const POOR_ACCURACY_WINDOW_MS = 6000;

type Props = {
  onLocationReady: (loc: ValidatedLocation | null) => void;
  lokasi: { lat: number; lng: number; radius: number };
};

export default function LocationPicker({ onLocationReady, lokasi }: Props) {
  const geolocationAvailable =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    geolocationAvailable ? "loading" : "error",
  );
  const [sampleProgress, setSampleProgress] = useState(0);
  const [location, setLocation] = useState<ValidatedLocation | null>(null);
  const [tamperingMsg, setTamperingMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState(
    geolocationAvailable ? "" : "Browser tidak mendukung GPS",
  );

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<l.Map | null>(null);
  const onLocationReadyRef = useRef(onLocationReady);

  useEffect(() => {
    onLocationReadyRef.current = onLocationReady;
  }, [onLocationReady]);

  const distance = location
    ? getDistance(lokasi.lat, lokasi.lng, location.lat, location.lng)
    : Infinity;

  const hasTampering =
    tamperingMsg !== "" ||
    (location !== null && location.tamperingReasons.length > 0);
  const accuracyTooLow =
    location !== null && location.accuracy > MAX_ACCEPTABLE_ACCURACY;
  const jumpAnomaly =
    location !== null && location.maxJumpMeters > MAX_SAMPLE_JUMP_METERS;
  const isValid =
    status === "success" &&
    location !== null &&
    !hasTampering &&
    distance <= lokasi.radius &&
    !accuracyTooLow &&
    !jumpAnomaly;

  useEffect(() => {
    if (!geolocationAvailable) return;

    const initialTampering = detectGeolocationTampering();
    if (initialTampering.length > 0) {
      const t = setTimeout(() => {
        setTamperingMsg(initialTampering[0]);
        setLocation(null);
        setStatus("error");
        setErrorMsg(
          "Terdeteksi ekstensi/skrip pengubah lokasi (Fake GPS) pada browser. Nonaktifkan ekstensi tersebut lalu muat ulang halaman.",
        );
        onLocationReadyRef.current(null);
      }, 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    let settled = false;
    const samples: GpsSample[] = [];
    const tamperingReasons: string[] = [];
    let watchId: number | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (settleTimer !== null) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const finalize = () => {
      if (cancelled || settled || samples.length === 0) return;
      settled = true;
      cleanup();

      const lateTampering = detectGeolocationTampering();
      const allTampering = Array.from(
        new Set([...tamperingReasons, ...lateTampering]),
      );

      if (allTampering.length > 0) {
        setTamperingMsg(allTampering[0]);
        setLocation(null);
        setStatus("error");
        setErrorMsg(
          "Terdeteksi ekstensi/skrip pengubah lokasi (Fake GPS) pada browser. Nonaktifkan ekstensi tersebut lalu muat ulang halaman.",
        );
        onLocationReadyRef.current(null);
        return;
      }

      // Catat kontradiksi izin hanya sebagai catatan audit (tidak memblokir keras karena
      // iOS Safari mode "Allow Once" kadang melaporkan permissions.query = denied secara keliru).
      checkGeolocationPermissionDenied()
        .then((denied) => {
          if (cancelled) return;
          const result = analyzeGpsSamples(samples, allTampering);
          if (denied) {
            result.suspiciousReasons.push(
              "Status permissions.query melaporkan denied saat koordinat diterima.",
            );
          }
          setTamperingMsg("");
          setLocation(result);
          setStatus("success");
          onLocationReadyRef.current(result);
        })
        .catch(() => {
          if (cancelled) return;
          const result = analyzeGpsSamples(samples, allTampering);
          setTamperingMsg("");
          setLocation(result);
          setStatus("success");
          onLocationReadyRef.current(result);
        });
    };

    let usedFallback = false;

    const startWatch = (highAccuracy: boolean) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled || settled) return;

          const posTampering = inspectGeolocationPosition(pos);
          if (posTampering.length > 0) {
            tamperingReasons.push(...posTampering);
            settled = true;
            cleanup();
            setTamperingMsg(posTampering[0]);
            setLocation(null);
            setStatus("error");
            setErrorMsg(
              "Terdeteksi ekstensi/skrip pengubah lokasi (Fake GPS) pada browser. Nonaktifkan ekstensi tersebut lalu muat ulang halaman.",
            );
            onLocationReadyRef.current(null);
            return;
          }

          samples.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
          setSampleProgress(Math.min(samples.length, TARGET_SAMPLES));

          const adaAkurasiBaik = samples.some(
            (s) => s.accuracy <= MAX_ACCEPTABLE_ACCURACY,
          );

          if (samples.length === 1) {
            settleTimer = setTimeout(
              finalize,
              adaAkurasiBaik ? SAMPLE_WINDOW_MS : POOR_ACCURACY_WINDOW_MS,
            );
          } else if (adaAkurasiBaik && samples.length >= TARGET_SAMPLES) {
            // Hanya langsung selesai saat sudah ada sampel dengan akurasi memadai;
            // jika sampel awal masih kasar (menara seluler), beri waktu GPS chip menyempurnakan lock.
            finalize();
          }
        },
        (err) => {
          if (cancelled || settled) return;
          if (samples.length > 0) {
            finalize();
            return;
          }
          // Di dalam ruangan RSUD sebagian HP gagal lock satelit (code 2/3);
          // otomatis fallback sekali ke mode lokasi jaringan/Wi-Fi.
          if (highAccuracy && !usedFallback && (err.code === 2 || err.code === 3)) {
            usedFallback = true;
            startWatch(false);
            return;
          }
          settled = true;
          cleanup();
          setLocation(null);
          setStatus("error");
          onLocationReadyRef.current(null);
          setErrorMsg(
            err.code === 1
              ? "Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser."
              : err.code === 2
                ? "GPS tidak tersedia. Pastikan layanan lokasi perangkat aktif."
                : "Waktu permintaan GPS habis. Coba lagi di area dengan sinyal lebih baik.",
          );
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 15000,
          maximumAge: highAccuracy ? 0 : 10000,
        },
      );
    };

    startWatch(true);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [geolocationAvailable, attempt]);

  const handleRefresh = () => {
    if (!geolocationAvailable) return;
    setStatus("loading");
    setLocation(null);
    setTamperingMsg("");
    setSampleProgress(0);
    setErrorMsg("");
    onLocationReadyRef.current(null);
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    if (status !== "success" || !location || !mapRef.current) return;
    if (mapInstance.current) return;

    const map = l.map(mapRef.current, {
      center: [location.lat, location.lng],
      zoom: 17,
      attributionControl: false,
    });
    l.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);

    // Lingkaran radius area absensi RSUD
    const areaCircle = l
      .circle([lokasi.lat, lokasi.lng], {
        radius: lokasi.radius,
        color: "#16a34a",
        fillColor: "#22c55e",
        fillOpacity: 0.12,
        weight: 2,
      })
      .addTo(map);

    // Lingkaran akurasi GPS user
    if (location.accuracy > 0 && location.accuracy <= 500) {
      l.circle([location.lat, location.lng], {
        radius: location.accuracy,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        weight: 1,
        dashArray: "4 4",
      }).addTo(map);
    }

    l.marker([location.lat, location.lng])
      .addTo(map)
      .bindPopup("Lokasi Anda")
      .openPopup();

    const bounds = areaCircle.getBounds().extend([location.lat, location.lng]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18 });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [status, location, lokasi.lat, lokasi.lng, lokasi.radius]);

  return (
    <div>
      {/* Status GPS */}
      <div
        className={`rounded-xl border flex gap-3 items-center justify-between p-4 mb-4 ${
          status === "loading"
            ? "bg-blue-50 border-blue-200"
            : isValid
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
        }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-full bg-white p-2 shrink-0 shadow-xs">
            <CiLocationOn
              className={`text-2xl ${
                status === "loading"
                  ? "text-blue-500"
                  : isValid
                    ? "text-green-600"
                    : "text-red-500"
              }`}
            />
          </div>
          <div className="flex flex-col min-w-0">
            {status === "loading" ? (
              <>
                <span className="text-sm font-semibold text-blue-900">
                  Memverifikasi GPS...
                </span>
                <span className="text-blue-700 text-xs">
                  {sampleProgress > 0
                    ? `Menstabilkan sinyal (${sampleProgress}/${TARGET_SAMPLES} sampel)`
                    : "Mengakses GPS perangkat Anda"}
                </span>
              </>
            ) : status === "error" ? (
              <>
                <span className="text-sm font-semibold text-red-800">
                  {hasTampering
                    ? "Terdeteksi Fake GPS / Ekstensi Browser"
                    : "Gagal mendapat lokasi"}
                </span>
                <span className="text-red-700 text-xs">{errorMsg}</span>
              </>
            ) : jumpAnomaly ? (
              <>
                <span className="text-sm font-semibold text-red-800">
                  Lokasi tidak stabil (anomali terdeteksi)
                </span>
                <span className="text-red-700 text-xs">
                  Koordinat meloncat {formatDistance(location!.maxJumpMeters)}{" "}
                  secara tiba-tiba. Matikan aplikasi lokasi tiruan lalu deteksi
                  ulang.
                </span>
              </>
            ) : accuracyTooLow ? (
              <>
                <span className="text-sm font-semibold text-red-800">
                  Akurasi GPS terlalu rendah (±{Math.round(location!.accuracy)}{" "}
                  m)
                </span>
                <span className="text-red-700 text-xs">
                  Maksimal akurasi {MAX_ACCEPTABLE_ACCURACY} m. Aktifkan mode
                  Akurasi Tinggi atau bergeser ke area lebih terbuka lalu coba
                  lagi.
                </span>
              </>
            ) : distance > lokasi.radius ? (
              <>
                <span className="text-sm font-semibold text-red-800">
                  Lokasi di luar jangkauan ({formatDistance(distance)})
                </span>
                <span className="text-red-700 text-xs">
                  Jarak maks: <strong>{lokasi.radius} m</strong> · Akurasi GPS:
                  ±{Math.round(location!.accuracy)} m
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-green-800">
                  Lokasi valid (dalam radius RSUD)
                </span>
                <span className="text-green-700 text-xs">
                  Jarak {formatDistance(distance)} · Akurasi ±
                  {Math.round(location!.accuracy)} m
                </span>
              </>
            )}
          </div>
        </div>

        {status !== "loading" && geolocationAvailable && (
          <button
            type="button"
            onClick={handleRefresh}
            title="Deteksi ulang GPS"
            aria-label="Deteksi ulang GPS"
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 active:scale-95">
            <FiRefreshCw className="text-sm" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>
        )}
      </div>

      {/* Map container */}
      {status === "loading" ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 px-6 text-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <h3 className="text-base font-semibold text-blue-700">
            Memverifikasi lokasi...
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            {sampleProgress > 0
              ? `Mengambil sampel GPS ${sampleProgress}/${TARGET_SAMPLES} untuk memastikan akurasi`
              : "Mengakses GPS perangkat Anda"}
          </p>
        </div>
      ) : status === "success" ? (
        <div
          ref={mapRef}
          className="notranslate w-full h-64 rounded-xl border border-gray-300 z-0"
        />
      ) : (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 px-6 text-center">
          <MdLocationOff className="mb-3 text-5xl text-red-400" />
          <h3 className="text-base font-semibold text-red-700">
            {hasTampering
              ? "Manipulasi GPS Terdeteksi"
              : "Gagal mendeteksi lokasi"}
          </h3>
          <p className="mt-1 text-sm text-red-600">
            {hasTampering
              ? "Nonaktifkan ekstensi Fake GPS (seperti Location Changer) di browser Anda, lalu muat ulang halaman ini."
              : "Pastikan GPS aktif dan izin lokasi telah diberikan, lalu coba lagi."}
          </p>
          {geolocationAvailable && (
            <button
              type="button"
              onClick={
                hasTampering ? () => window.location.reload() : handleRefresh
              }
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700">
              <FiRefreshCw />
              {hasTampering ? "Muat Ulang Halaman" : "Coba Lagi"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
