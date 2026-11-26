import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import StepWizard from "../components/Present Page/StepWizard";
import ValidateLocation from "../components/Present Page/ValidateLocation";
import ValidateSelfie from "../components/Present Page/ValidateSelfie";
import ConfirmPresent from "../components/Present Page/ConfirmPresent";
import TopNavbar from "../components/Client Page/TopNavbar";
import Skeleton from "../components/Skeleton";
import {
  FaStar,
  FaRegStar,
  FaTriangleExclamation,
  FaCircleInfo,
} from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import type { ValidatedLocation } from "../utils/GeoLocation";
import { preloadFaceDetector } from "../utils/FaceDetection";
import { getAttRecords, getStatus } from "../utils/api/Attendence";
import { getTodayLeave } from "../utils/api/Leave";
import type { SessionRecord } from "../hooks/useOpenSession";
import useSessionShift from "../hooks/useSessionShift";
import { GetTodayKey, isSesiTerlupakan } from "../utils/DateUtils";

type GuardStatus = {
  key: string;
  riwayat: SessionRecord[];
  hasMasukNonDokter: boolean;
  hasLeave: boolean;
};

type StatusRes = {
  sukses?: boolean;
  absen_masuk?: { waktu: string; status: string } | null;
  absen_pulang?: { waktu: string } | null;
};

type RiwayatRes = {
  sukses?: boolean;
  riwayat?: SessionRecord[];
};

type PendingData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  distance: number;
  capturedAt: number;
  suspiciousReasons: string[];
  image: string | null;
};

type HasilAbsen = {
  sukses: boolean;
  pesan: string;
  jenis?: string;
  status?: string;
  menit?: number;
  bintang?: number;
};

const steps: string[] = ["Lokasi", "Selfie", "Konfirmasi"];

function BintangSukses({ nilai }: { nilai?: number }) {
  if (nilai === undefined) return null;
  const bulat = Math.round(nilai);
  return (
    <span className="flex gap-1 text-amber-400 text-2xl">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= bulat ? <FaStar key={i} /> : <FaRegStar key={i} />,
      )}
    </span>
  );
}

export default function PresentPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasil, setHasil] = useState<HasilAbsen | null>(null);
  const [pendingData, setPendingData] = useState<PendingData>({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    distance: 0,
    capturedAt: 0,
    suspiciousReasons: [],
    image: null,
  });
  const { isDokter } = useAuth();
  const [guardStatus, setGuardStatus] = useState<GuardStatus | null>(null);

  const isValidType = type === "masuk" || type === "pulang";
  const checkKey = `${type ?? ""}:${isDokter ? "1" : "0"}`;

  // Periksa status absensi terbaru agar URL /present/masuk atau /present/pulang
  // tidak bisa diakses bila sudah absen, belum absen masuk, atau sedang izin/cuti.
  useEffect(() => {
    if (!isValidType || currentStep >= 3) return;

    let aktif = true;
    Promise.all([
      getAttRecords().catch(() => null) as Promise<RiwayatRes | null>,
      !isDokter
        ? (getStatus().catch(() => null) as Promise<StatusRes | null>)
        : Promise.resolve(null),
      getTodayLeave().catch(() => ({ hasLeave: false })),
    ]).then(([riwayatRes, statusRes, leaveRes]) => {
      if (!aktif) return;
      setGuardStatus({
        key: checkKey,
        riwayat: riwayatRes?.riwayat ?? [],
        hasMasukNonDokter: !!statusRes?.absen_masuk,
        hasLeave: !!leaveRes?.hasLeave,
      });
    });

    return () => {
      aktif = false;
    };
  }, [checkKey, currentStep, isDokter, isValidType]);

  const guardReady = isValidType && guardStatus?.key === checkKey;
  const openSession = guardReady
    ? (guardStatus.riwayat.find((r) => r.jam_pulang == null) ?? null)
    : null;
  const crossDay = !!openSession && openSession.tanggal < GetTodayKey();
  const { shift: sessionShift, loading: loadingSessionShift } = useSessionShift(
    openSession,
    guardReady && !isDokter && crossDay,
  );

  const sesiTerlupakan =
    guardReady &&
    !isDokter &&
    !loadingSessionShift &&
    isSesiTerlupakan(openSession, sessionShift);

  const stillChecking =
    !isValidType || !guardReady || (!isDokter && crossDay && loadingSessionShift);

  const adaSesiTerbuka = !!openSession;
  const hasLeave = guardReady ? guardStatus.hasLeave : false;
  const hasMasuk =
    openSession && !sesiTerlupakan
      ? true
      : isDokter
        ? guardReady &&
          guardStatus.riwayat.some(
            (r) => r.tanggal === GetTodayKey() || r.jam_pulang == null,
          )
        : guardReady && guardStatus.hasMasukNonDokter;

  const bolehAkses = !stillChecking
    ? type === "masuk"
      ? !hasLeave && !(adaSesiTerbuka && !sesiTerlupakan) && (isDokter || !hasMasuk)
      : !hasLeave && adaSesiTerbuka && !sesiTerlupakan
    : false;

  useEffect(() => {
    if (currentStep >= 3) return;
    if (!isValidType || (!stillChecking && !bolehAkses)) {
      navigate("/", { replace: true });
    }
  }, [bolehAkses, currentStep, isValidType, navigate, stillChecking]);

  // Muat model deteksi wajah di latar belakang sejak Step 0 agar Step 1 instan
  useEffect(() => {
    if (!stillChecking && bolehAkses) {
      preloadFaceDetector();
    }
  }, [bolehAkses, stillChecking]);

  if (currentStep < 3 && (stillChecking || !bolehAkses)) {
    return (
      <div>
        <TopNavbar />
        <section className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col items-center gap-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <div className="flex w-full max-w-sm items-center justify-between gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-1 flex-1 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-1 flex-1 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </section>
        <section className="p-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <TopNavbar />
      {/* steps wizard */}
      <section className="bg-white border-b border-gray-300 px-4 py-3 flex flex-col gap-3">
        <h1 className="text-lg font-bold text-center capitalize">
          Absen {type}
        </h1>
        <div className="w-full">
          <StepWizard currentStep={currentStep} steps={steps} />
        </div>
      </section>

      {/* step part */}
      <section className="p-4">
        {currentStep === 0 && (
          <ValidateLocation
            setCurrentStep={setCurrentStep}
            onNext={(loc: ValidatedLocation, distance: number) =>
              setPendingData((prev) => ({
                ...prev,
                latitude: loc.lat,
                longitude: loc.lng,
                accuracy: loc.accuracy,
                capturedAt: loc.capturedAt,
                suspiciousReasons: loc.suspiciousReasons,
                distance,
              }))
            }
          />
        )}
        {currentStep === 1 && (
          <ValidateSelfie
            setCurrentStep={setCurrentStep}
            locationMeta={{
              latitude: pendingData.latitude,
              longitude: pendingData.longitude,
              accuracy: pendingData.accuracy,
            }}
            onNext={(image) => setPendingData((prev) => ({ ...prev, image }))}
          />
        )}
        {currentStep === 2 && (
          <ConfirmPresent
            setCurrentStep={setCurrentStep}
            onSuccess={(res) => setHasil(res)}
            data={pendingData}
          />
        )}
        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-700">
              Absen Berhasil!
            </h2>
            {hasil?.jenis === "telat" && (
              <div className="flex w-full items-center gap-3 rounded-xl bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
                <FaTriangleExclamation className="shrink-0 text-amber-600" />
                <span>
                  Anda terlambat <strong>{hasil.menit}</strong> menit
                </span>
              </div>
            )}
            {hasil?.jenis === "awal" && (
              <div className="flex w-full items-center gap-3 rounded-xl bg-blue-100 px-4 py-3 text-sm font-medium text-blue-800">
                <FaCircleInfo className="shrink-0 text-blue-600" />
                <span>
                  Anda pulang lebih awal <strong>{hasil.menit}</strong> menit
                </span>
              </div>
            )}
            {hasil?.pesan && (
              <p className="text-sm text-gray-600 text-center">{hasil.pesan}</p>
            )}
            {!isDokter && (
              <>
                <BintangSukses nilai={hasil?.bintang} />
                <p className="text-xs text-gray-400">
                  {hasil?.bintang !== undefined
                    ? `Bintang ketepatan hari ini: ${hasil.bintang}/5`
                    : "Bintang ketepatan dihitung dari ketepatan waktu masuk & pulang."}
                </p>
              </>
            )}
            {isDokter && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-100 px-4 py-3 text-sm font-medium text-blue-800">
                <FaCircleInfo className="shrink-0 text-blue-600" />
                <span>
                  Anda dapat absen masuk & pulang kembali dalam hari yang sama
                  (absen multi-sesi).
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Mengalihkan ke halaman utama...
            </p>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              Kembali ke Beranda
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
