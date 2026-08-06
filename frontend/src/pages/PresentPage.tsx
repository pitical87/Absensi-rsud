import { useParams } from "react-router";
import { useState } from "react";
import StepWizard from "../components/Present Page/StepWizard";
import ValidateLocation from "../components/Present Page/ValidateLocation";
import ValidateSelfie from "../components/Present Page/ValidateSelfie";
import ConfirmPresent from "../components/Present Page/ConfirmPresent";
import TopNavbar from "../components/Client Page/TopNavbar";
import { FaStar, FaRegStar, FaTriangleExclamation, FaCircleInfo } from "react-icons/fa6";

type PendingData = {
  latitude: number;
  longitude: number;
  distance: number;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [hasil, setHasil] = useState<HasilAbsen | null>(null);
  const [pendingData, setPendingData] = useState<PendingData>({
    latitude: 0,
    longitude: 0,
    distance: 0,
    image: null,
  });

  return (
    <div>
      <TopNavbar />
      {/* steps wizard */}
      <section className="bg-white border-b border-gray-300 px-4 py-1 flex flex-col gap-3">
        <h1 className="text-lg font-bold">Absen {type}</h1>
        <div className="w-full">
          <StepWizard currentStep={currentStep} steps={steps} />
        </div>
      </section>

      {/* step part */}
      <section className="p-4">
        {currentStep === 0 && (
          <ValidateLocation
            setCurrentStep={setCurrentStep}
            onNext={(lat, lng, distance) =>
              setPendingData((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                distance,
              }))
            }
          />
        )}
        {currentStep === 1 && (
          <ValidateSelfie
            setCurrentStep={setCurrentStep}
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
            <BintangSukses nilai={hasil?.bintang} />
            <p className="text-xs text-gray-400">
              {hasil?.bintang !== undefined
                ? `Bintang ketepatan hari ini: ${hasil.bintang}/5`
                : "Bintang ketepatan dihitung dari ketepatan waktu masuk & pulang."}
            </p>
            <p className="text-sm text-gray-500">
              Mengalihkan ke halaman utama...
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
