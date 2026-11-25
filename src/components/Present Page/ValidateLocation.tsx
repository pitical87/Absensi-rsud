import { useNavigate } from "react-router";
import LocationPicker from "./LocationPicker";
import { useAuth } from "../../context/AuthContext";
import { useCallback, useState } from "react";
import {
  getDistance,
  MAX_ACCEPTABLE_ACCURACY,
  MAX_DISTANCE,
  MAX_SAMPLE_JUMP_METERS,
  TARGET_LAT,
  TARGET_LNG,
  type ValidatedLocation,
} from "../../utils/GeoLocation";

type Props = {
  setCurrentStep: (step: number) => void;
  onNext: (loc: ValidatedLocation, jarak: number) => void;
};

export default function ValidateLocation({ setCurrentStep, onNext }: Props) {
  const { lokasi } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState<ValidatedLocation | null>(null);

  const targetLokasi = lokasi ?? {
    lat: TARGET_LAT,
    lng: TARGET_LNG,
    radius: MAX_DISTANCE,
  };

  const distance = location
    ? getDistance(targetLokasi.lat, targetLokasi.lng, location.lat, location.lng)
    : Infinity;

  const canProceed =
    location !== null &&
    location.tamperingReasons.length === 0 &&
    distance <= targetLokasi.radius &&
    location.accuracy <= MAX_ACCEPTABLE_ACCURACY &&
    location.maxJumpMeters <= MAX_SAMPLE_JUMP_METERS;

  const handleLocationReady = useCallback(
    (loc: ValidatedLocation | null) => setLocation(loc),
    [],
  );

  return (
    <div className="bg-white w-full rounded-2xl p-4">
      <h1 className="text-lg mb-3 font-medium">Validasi GPS</h1>

      <LocationPicker
        onLocationReady={handleLocationReady}
        lokasi={targetLokasi}
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold cursor-pointer hover:bg-red-700 transition-colors">
          Kembali
        </button>

        <button
          type="button"
          disabled={!canProceed}
          onClick={() => {
            if (!location || !canProceed) return;
            onNext(location, distance);
            setCurrentStep(1);
          }}
          className="w-full rounded-xl py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 enabled:cursor-pointer">
          Lanjut
        </button>
      </div>
    </div>
  );
}
