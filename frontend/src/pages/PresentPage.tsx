import { useParams } from "react-router";
import { useState } from "react";
import StepWizard from "../components/Present Page/StepWizard";
import ValidateLocation from "../components/Present Page/ValidateLocation";
import ValidateSelfie from "../components/Present Page/ValidateSelfie";
import ConfirmPresent from "../components/Present Page/ConfirmPresent";

type PendingData = {
  latitude: number;
  longitude: number;
  distance: number;
  image: string | null;
};

const steps: string[] = ["Lokasi", "Selfie", "Konfirmasi"];

export default function PresentPage() {
  const { type } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [pendingData, setPendingData] = useState<PendingData>({
    latitude: 0,
    longitude: 0,
    distance: 0,
    image: null,
  });

  return (
    <div>
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
          <ConfirmPresent setCurrentStep={setCurrentStep} data={pendingData} />
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
            <p className="text-sm text-gray-500">
              Mengalihkan ke halaman utama...
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
