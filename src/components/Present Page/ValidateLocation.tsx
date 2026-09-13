import { useNavigate } from "react-router";
import LocationPicker from "./LocationPicker";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { getDistance } from "../../utils/GeoLocation";

type props = {
  setCurrentStep: (step: number) => void;
  onNext: (lat: number, lng: number, jarak: number) => void;
};

export default function ValidateLocation({ setCurrentStep, onNext }: props) {
  const { lokasi } = useAuth(); //office location from backend
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const distance =
    location && lokasi
      ? getDistance(lokasi.lat, lokasi.lng, location.lat, location.lng)
      : Infinity;

  return (
    <div className="bg-white w-full rounded-2xl p-4">
      <h1 className="text-lg mb-3 font-medium">Validasi GPS</h1>

      {/* show map */}
      {lokasi && (
        <LocationPicker
          onLocationReady={(loc) => setLocation(loc)}
          lokasi={lokasi}
        />
      )}

      {/* Next button — enable only if location is ready */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-xl bg-red-600 py-3 text-white font-semibold cursor-pointer 
                  hover:bg-red-700 transition-colors">
          Kembali
        </button>

        <button
          disabled={!location || distance > (lokasi?.radius ?? 100)}
          onClick={() => {
            if (!location) return;
            onNext(location?.lat, location?.lng, distance);
            setCurrentStep(1);
          }}
          className="
                     w-full rounded-xl py-3 font-semibold transition-colors
                    disabled:cursor-not-allowed
                    disabled:bg-gray-300
                    disabled:text-gray-500
                    enabled:bg-blue-600
                    enabled:text-white
                    enabled:hover:bg-blue-700
                    enabled:cursor-pointer
      ">
          Lanjut
        </button>
      </div>
    </div>
  );
}
