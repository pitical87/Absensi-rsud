import L from "Leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useRef, useState } from "react";
import { CiLocationOn } from "react-icons/ci";
import { MdLocationOff } from "react-icons/md";
import { formatDistance, getDistance } from "../../utils/GeoLocation";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type LocationData = {
  lat: number;
  lng: number;
};

type Props = {
  onLocationReady: (loc: LocationData) => void;
  lokasi: { lat: number; lng: number; radius: number };
};

export default function LocationPicker({ onLocationReady, lokasi }: Props) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const distance = location
    ? getDistance(lokasi.lat, lokasi.lng, location!.lat, location!.lng)
    : Infinity;

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Browser tidak mendukung GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setStatus("success");
        onLocationReady(loc);
      },
      (err) => {
        setStatus("error");
        setErrorMsg(
          err.code === 1
            ? "Izin lokasi ditolak"
            : err.code === 2
              ? "GPS tidak tersedia"
              : "Waktu permintaan habis",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [onLocationReady]);

  useEffect(() => {
    if (status !== "success" || !location || !mapRef.current) return;
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [location.lat, location.lng],
      zoom: 17,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
    }).addTo(map);
    L.marker([location.lat, location.lng])
      .addTo(map)
      .bindPopup("Lokasi Anda")
      .openPopup();

    mapInstance.current = map;
  }, [status, location]);
  return (
    <div>
      {/* status GPS */}
      <div
        className={`rounded-xl border flex gap-2 items-center p-4 mb-4 ${
          status === "loading"
            ? "bg-blue-100 border-blue-300"
            : status === "success" && distance <= lokasi.radius
              ? "bg-green-100 border-green-300"
              : "bg-red-100 border-red-300"
        }`}>
        <div className="rounded-full bg-white p-2">
          <CiLocationOn
            className={`text-2xl ${
              status === "loading"
                ? "text-blue-300"
                : status === "success" && distance <= lokasi.radius
                  ? "text-green-500"
                  : "text-red-400"
            }`}
          />
        </div>
        <div className="flex flex-col">
          {status === "loading" ? (
            <>
              Mendapatkan lokasi...
              <span className="text-gray-400 text-sm">
                Mengakses GPS perangkat anda
              </span>
            </>
          ) : status === "success" && distance <= lokasi.radius ? (
            <>
              Lokasi ditemukan
              <span className="text-gray-500 text-sm">
                {formatDistance(distance)}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm">
                Lokasi anda ({formatDistance(distance)}) diluar jangkauan!!
                <br />
                <b>(Jarak Maks: {lokasi.radius} m)</b>
              </span>
            </>
          )}
          {status === "error" && (
            <>
              Gagal mendapat lokasi
              <span className="text-gray-500 text-sm">{errorMsg}</span>
            </>
          )}
        </div>
      </div>

      {/* map container */}
      {status === "loading" ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50 px-6 text-center">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <h3 className="text-base font-semibold text-blue-700">
            Mendapatkan lokasi...
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            Mengakses GPS perangkat anda
          </p>
        </div>
      ) : status === "success" ? (
        <div
          ref={mapRef}
          className="w-full h-64 rounded-xl border border-gray-300 z-0"
        />
      ) : (
        <div
          className="
            flex h-64 w-full flex-col items-center justify-center
            rounded-xl border border-dashed border-red-300
            bg-red-50 px-6 text-center
        ">
          <MdLocationOff className="mb-3 text-5xl text-red-400" />
          <h3 className="text-base font-semibold text-red-700">
            Gagal mendeteksi lokasi
          </h3>
          <p className="mt-1 text-sm text-red-600">
            Pastikan GPS aktif dan izin lokasi telah diberikan, lalu coba lagi.
          </p>
        </div>
      )}
    </div>
  );
}
