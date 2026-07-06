import { useNavigate, useParams } from "react-router";
import { GetCurrentDateString, GetCurrentTime } from "../../utils/DateUtils";
import { formatDistance, MAX_DISTANCE } from "../../utils/GeoLocation";
import { saveAttendance } from "../../utils/Storage";
import { useState } from "react";
type Props = {
  setCurrentStep: (step: number) => void;
  data: {
    latitude: number;
    longitude: number;
    distance: number;
    image: string | null;
  };
};

export default function ConfirmPresent({ setCurrentStep, data }: Props) {
  const { type } = useParams();
  const navigate = useNavigate();
  const date = GetCurrentDateString();
  const time = GetCurrentTime();
  const distanceString = formatDistance(data.distance);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);

    const record = {
      id: Date.now().toString(),
      type: type ?? "",
      date,
      time,
      latitude: data.latitude,
      longitude: data.longitude,
      distance: data.distance,
      image: data.image ?? "",
    };

    // Simulasi latency
    await new Promise((r) => setTimeout(r, 1500));

    saveAttendance(record);

    console.log("📤 Data absensi tersimpan:", record);

    setSubmitting(false);

    setCurrentStep(3);
    // Redirect setelah 2 detik
    setTimeout(() => navigate("/"), 2000);
  }

  return (
    <div className="bg-white w-full rounded-2xl p-4">
      <h1 className="text-lg mb-3 font-medium">Konfirmasi Absensi</h1>
      <ul>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Jenis</span>
          <span className=" text-blue-400">
            {type == "masuk" ? "Absen Masuk" : "Absen Pulang"}
          </span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Tanggal</span>
          <span className=" text-gray-900">{date}</span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Waktu</span>
          <span className=" text-gray-900">{time} WIT</span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Jarak</span>
          <span className=" text-gray-900">{distanceString}</span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Koordinat</span>
          <span className=" text-gray-900">
            {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
          </span>
        </li>
        <li className="flex items-center justify-between border-b border-gray-300 py-3">
          <span className=" text-gray-500">Status</span>
          <span
            className={`${
              data.distance <= MAX_DISTANCE
                ? "text-green-600 bg-green-100"
                : "text-red-600 bg-red-100"
            } px-2 py-1 rounded-xl`}>
            {" "}
            {data.distance <= MAX_DISTANCE ? "Dalam Radius" : "Diluar Radius"}
          </span>
        </li>
      </ul>
      {data.image && (
        <div className="mt-4">
          <p className="text-gray-500 mb-2">Foto Selfie</p>
          <img
            src={data.image}
            alt="Selfie"
            className="w-full h-64 rounded-xl border border-gray-300 object-cover"
          />
        </div>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
          Kembali
        </button>

        <button
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
          {submitting ? (
            <>
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
              Menyimpan...
            </>
          ) : (
            "Konfirmasi Absensi"
          )}
        </button>
      </div>
    </div>
  );
}
