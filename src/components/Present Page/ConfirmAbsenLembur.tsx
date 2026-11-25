import { useNavigate } from "react-router";
import { GetCurrentTime } from "../../utils/DateUtils";
import {
  detectGeolocationTampering,
  formatDistance,
  getDistance,
  getFreshPosition,
  LOCATION_FRESH_MS,
  MAX_ACCEPTABLE_ACCURACY,
} from "../../utils/GeoLocation";
import { useEffect, useRef, useState } from "react";
import { absenLemburMasuk, absenLemburPulang } from "../../utils/api/Lembur";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { HiOutlineChevronDown } from "react-icons/hi";

export type HasilAbsenLembur = {
  sukses: boolean;
  pesan: string;
  tipe: "masuk" | "pulang";
  waktu?: string;
  status?: string;
  menit?: number;
  bintang?: number;
  durasiTeks?: string;
};

type Props = {
  tipe: "masuk" | "pulang";
  tanggal: string;
  setCurrentStep: (step: number) => void;
  onSuccess?: (result: HasilAbsenLembur) => void;
  data: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distance: number;
    capturedAt: number;
    suspiciousReasons: string[];
    image: string | null;
  };
};

function durasiTeks(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa} menit`;
  if (sisa === 0) return `${jam} jam`;
  return `${jam} jam ${sisa} menit`;
}

export default function ConfirmAbsenLembur({
  tipe,
  tanggal,
  setCurrentStep,
  onSuccess,
  data,
}: Props) {
  const navigate = useNavigate();
  const time = GetCurrentTime();
  const { lokasi } = useAuth();
  const distanceString = formatDistance(data.distance);
  const [submitting, setSubmitting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const radius = lokasi?.radius ?? 0;
  const isWithinRadius = data.distance <= radius;

  async function handleSubmit() {
    if (submitting) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Tidak ada koneksi internet. Periksa jaringan Anda.");
      return;
    }

    setSubmitting(true);
    let sukses = false;
    try {
      const tampering = detectGeolocationTampering();
      if (tampering.length > 0) {
        toast.error(
          "Terdeteksi ekstensi Fake GPS pada browser. Nonaktifkan ekstensi lalu muat ulang halaman.",
        );
        setCurrentStep(0);
        return;
      }

      let lat = data.latitude;
      let lng = data.longitude;
      let akurasi = data.accuracy;
      const gpsAnomali = [...data.suspiciousReasons];

      if (Date.now() - data.capturedAt > LOCATION_FRESH_MS) {
        try {
          const fresh = await getFreshPosition(10_000);
          if (lokasi) {
            const freshDist = getDistance(
              lokasi.lat,
              lokasi.lng,
              fresh.lat,
              fresh.lng,
            );
            if (freshDist > lokasi.radius) {
              toast.error(
                `Lokasi terbaru Anda (${formatDistance(freshDist)}) berada di luar radius RSUD. Validasi ulang GPS.`,
              );
              setCurrentStep(0);
              return;
            }
          }
          if (fresh.accuracy > MAX_ACCEPTABLE_ACCURACY) {
            toast.error(
              `Akurasi GPS terbaru terlalu rendah (±${Math.round(fresh.accuracy)} m). Validasi ulang GPS.`,
            );
            setCurrentStep(0);
            return;
          }
          lat = fresh.lat;
          lng = fresh.lng;
          akurasi = fresh.accuracy;
        } catch (geoErr) {
          const geoMsg =
            geoErr instanceof Error && geoErr.message
              ? geoErr.message
              : "Sesi lokasi sudah kedaluwarsa. Silakan validasi ulang GPS Anda.";
          toast.error(geoMsg);
          setCurrentStep(0);
          return;
        }
      }

      const payload = {
        tanggal,
        lat,
        lng,
        akurasi,
        foto: data.image ?? undefined,
        ...(gpsAnomali.length > 0 ? { gps_anomali: gpsAnomali } : {}),
      };
      if (tipe === "masuk") {
        const res = await absenLemburMasuk(payload);
        if (res.sukses) {
          toast.success(res.pesan);
          onSuccess?.({
            sukses: true,
            pesan: res.pesan,
            tipe: "masuk",
            waktu: res.data.waktu,
            status: res.data.status,
            menit: res.data.menit_terlambat || 0,
            bintang: res.data.bintang,
          });
        } else {
          toast.error(res.pesan);
          return;
        }
      } else {
        const res = await absenLemburPulang(payload);
        if (res.sukses) {
          toast.success(res.pesan);
          onSuccess?.({
            sukses: true,
            pesan: res.pesan,
            tipe: "pulang",
            bintang: res.data.bintang_harian,
            durasiTeks: durasiTeks(res.data.durasi_menit),
          });
        } else {
          toast.error(res.pesan);
          return;
        }
      }
      sukses = true;
      setCurrentStep(3);
      redirectTimerRef.current = setTimeout(() => navigate("/"), 10000);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "ECONNABORTED") {
        toast.error("Koneksi timeout. Periksa sinyal lalu coba lagi.");
      } else {
        const pesan = (
          err as {
            response?: { data?: { pesan?: string } };
          }
        )?.response?.data?.pesan;
        toast.error(pesan || "Gagal mengirim data");
      }
    } finally {
      if (!sukses) setSubmitting(false);
    }
  }

  return (
    <div className="bg-white w-full rounded-2xl p-4">
      <h1 className="text-lg mb-3 font-medium">Konfirmasi Absen Lembur</h1>
      <ul>
        <li className="flex items-center justify-between border-b border-gray-200 py-3">
          <span className="text-gray-500">Tanggal</span>
          <span className="text-gray-900 font-medium">{tanggal}</span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-200 py-3">
          <span className="text-gray-500">Waktu</span>
          <span className="text-gray-900 font-medium">{time} WIT</span>
        </li>
      </ul>

      {data.image && (
        <div className="mt-4">
          <p className="text-gray-500 mb-2 text-sm">Foto Selfie</p>
          <img
            src={data.image}
            alt="Selfie"
            className="w-full h-64 rounded-xl border border-gray-300 object-cover"
          />
        </div>
      )}

      {/* Accordion detail lainnya */}
      <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          aria-expanded={showDetail}
          onClick={() => setShowDetail((prev) => !prev)}
          className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100">
          <span>Detail Lainnya</span>
          <HiOutlineChevronDown
            className={`text-lg text-gray-500 transition-transform duration-200 ${
              showDetail ? "rotate-180" : ""
            }`}
          />
        </button>

        {showDetail && (
          <ul className="divide-y divide-gray-200 bg-white px-4 text-sm">
            <li className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Jenis</span>
              <span className="text-blue-500 font-medium">
                {tipe === "masuk"
                  ? "Absen Masuk Lembur"
                  : "Absen Pulang Lembur"}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Jarak</span>
              <span className="text-gray-900">{distanceString}</span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Akurasi GPS</span>
              <span className="text-gray-900">
                ±{Math.round(data.accuracy)} m
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Koordinat</span>
              <span className="text-gray-900 text-xs">
                {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span className="text-gray-500">Status</span>
              <span
                className={`${
                  isWithinRadius
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                } px-2 py-0.5 rounded-lg text-xs font-medium`}>
                {isWithinRadius ? "Dalam Radius" : "Diluar Radius"}
              </span>
            </li>
          </ul>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => setCurrentStep(1)}
          className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
          Kembali
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !isWithinRadius}
          className="flex-1 flex items-center justify-center rounded-xl bg-blue-600 py-3 text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
          {submitting ? (
            <div className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Menyimpan...</span>
            </div>
          ) : (
            <span>Konfirmasi Absen</span>
          )}
        </button>
      </div>
    </div>
  );
}
