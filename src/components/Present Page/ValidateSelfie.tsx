import type { FaceDetector } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CiCamera } from "react-icons/ci";
import { FaTriangleExclamation } from "react-icons/fa6";
import { FiRefreshCw } from "react-icons/fi";
import { GetCurrentDateString, GetCurrentTime } from "../../utils/DateUtils";
import {
  detectFaceInVideo,
  getFaceDetector,
  resetFaceDetectionState,
} from "../../utils/FaceDetection";

const MAX_SELFIE_WIDTH = 720;
const SELFIE_JPEG_QUALITY = 0.75;
const MIN_BRIGHTNESS = 12;
const DETECT_INTERVAL_MS = 300;

const VIRTUAL_CAMERA_PATTERNS = [
  "obs",
  "virtual",
  "manycam",
  "snap camera",
  "droidcam",
  "iriun",
  "epoccam",
  "splitcam",
  "youcam",
  "camo",
];

function isVirtualCamera(label: string): boolean {
  const lower = label.toLowerCase();
  return VIRTUAL_CAMERA_PATTERNS.some((kw) => lower.includes(kw));
}

function hitungRataKecerahan(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): number {
  const { data } = ctx.getImageData(0, 0, w, h);
  let total = 0;
  let count = 0;
  // Sampling tiap 16 pixel agar ringan di ponsel
  for (let i = 0; i < data.length; i += 64) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total += 0.299 * r + 0.587 * g + 0.114 * b;
    count++;
  }
  return count > 0 ? total / count : 0;
}

type Props = {
  setCurrentStep: (step: number) => void;
  onNext: (image: string) => void;
  locationMeta?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
};

export default function ValidateSelfie({
  setCurrentStep,
  onNext,
  locationMeta,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<FaceDetector | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectorStatus, setDetectorStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedWithoutFace, setCapturedWithoutFace] = useState(false);
  const [showNoFacePopup, setShowNoFacePopup] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Inisialisasi model deteksi wajah MediaPipe
  useEffect(() => {
    let cancelled = false;

    getFaceDetector()
      .then((det) => {
        if (cancelled) return;
        detectorRef.current = det;
        setDetectorStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setDetectorStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Mulai kamera depan
  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Browser tidak mendukung akses kamera.");
        return;
      }

      const constraintList: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        },
        { video: { facingMode: "user" }, audio: false },
        { video: true, audio: false },
      ];

      let mediaStream: MediaStream | null = null;
      let lastErr: unknown = null;

      for (const constraints of constraintList) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err: unknown) {
          lastErr = err;
          const name = err instanceof Error ? err.name : "";
          // Jika user menolak izin kamera, tidak perlu mencoba constraint fallback
          if (name === "NotAllowedError" || name === "PermissionDeniedError") {
            break;
          }
        }
      }

      if (!mediaStream) {
        if (cancelled) return;
        const name = lastErr instanceof Error ? lastErr.name : "";
        setError(
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Izin kamera ditolak. Aktifkan izin kamera pada browser Anda."
            : "Kamera tidak tersedia atau sedang digunakan aplikasi lain.",
        );
        return;
      }

      if (cancelled) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && isVirtualCamera(videoTrack.label)) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setError(
          "Kamera virtual terdeteksi. Gunakan kamera asli perangkat Anda untuk absensi.",
        );
        return;
      }

      localStream = mediaStream;
      setStream(mediaStream);
    }

    startCamera();

    return () => {
      cancelled = true;
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [attempt]);

  const markVideoReady = () => {
    const v = videoRef.current;
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      setCameraReady(true);
    }
  };

  useEffect(() => {
    if (capturedImage) return;
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video
      .play()
      .then(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setCameraReady(true);
        }
      })
      .catch(() => {});

    // Fallback polling singkat untuk browser Android/iOS yang videoWidth-nya baru terisi setelah play
    const poll = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setCameraReady(true);
        clearInterval(poll);
      }
    }, 200);

    return () => clearInterval(poll);
  }, [capturedImage, stream]);

  // Loop deteksi wajah real-time saat live preview kamera aktif
  useEffect(() => {
    if (capturedImage || !cameraReady || detectorStatus !== "ready") {
      return;
    }

    let rafId = 0;
    let lastRun = 0;
    let active = true;

    const tick = (now: number) => {
      if (!active) return;
      if (now - lastRun >= DETECT_INTERVAL_MS) {
        lastRun = now;
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (video && detector) {
          try {
            const adaWajah = detectFaceInVideo(detector, video);
            setFaceDetected(adaWajah);
          } catch {
            // abaikan galat frame sementara
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [capturedImage, cameraReady, detectorStatus]);

  function retryCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraReady(false);
    setFaceDetected(false);
    setCapturedImage(null);
    setError("");
    setDetectorStatus("loading");
    setAttempt((n) => n + 1);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Kamera belum siap. Tunggu sebentar lalu coba lagi.");
      return;
    }

    // Cek deteksi wajah saat ambil foto (sebagai warning, tidak memblokir ambil foto).
    // Jika model deteksi wajah gagal dimuat di HP lama, jangan blokir atau memunculkan peringatan palsu.
    const detector = detectorRef.current;
    let adaWajahSaatAmbil = true;
    if (detector && detectorStatus === "ready") {
      try {
        adaWajahSaatAmbil = detectFaceInVideo(detector, video, true);
      } catch {
        adaWajahSaatAmbil = faceDetected;
      }
      setFaceDetected(adaWajahSaatAmbil);
    }

    const scale = Math.min(1, MAX_SELFIE_WIDTH / video.videoWidth);
    const targetW = Math.round(video.videoWidth * scale);
    const targetH = Math.round(video.videoHeight * scale);

    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetW, targetH);

    // Cek frame gelap/tertutup sebelum menambahkan watermark
    const avgBrightness = hitungRataKecerahan(ctx, targetW, targetH);
    if (avgBrightness < MIN_BRIGHTNESS) {
      toast.error(
        "Foto terlalu gelap atau kamera tertutup. Pastikan wajah terlihat jelas.",
      );
      return;
    }

    // Watermark audit tipis di bagian bawah foto
    const barHeight = Math.max(36, Math.round(targetH * 0.09));
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.fillRect(0, targetH - barHeight, targetW, barHeight);

    const fontSize = Math.max(11, Math.round(targetW * 0.024));
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;

    const waktuText = `${GetCurrentDateString()} · ${GetCurrentTime()} WIT`;
    const lokasiText = locationMeta
      ? `${locationMeta.latitude.toFixed(6)}, ${locationMeta.longitude.toFixed(6)} (±${Math.round(locationMeta.accuracy)}m)`
      : "";

    const padX = Math.max(10, Math.round(targetW * 0.025));
    if (lokasiText) {
      ctx.fillText(waktuText, padX, targetH - barHeight + fontSize + 5);
      ctx.font = `400 ${Math.max(10, fontSize - 1)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(lokasiText, padX, targetH - 7);
    } else {
      ctx.fillText(
        waktuText,
        padX,
        targetH - Math.round(barHeight / 2) + Math.round(fontSize / 3),
      );
    }

    const imageData = canvas.toDataURL("image/jpeg", SELFIE_JPEG_QUALITY);
    setCapturedImage(imageData);
    setCapturedWithoutFace(!adaWajahSaatAmbil);
    if (!adaWajahSaatAmbil) {
      setShowNoFacePopup(true);
    }
  }

  function retake() {
    resetFaceDetectionState();
    setShowNoFacePopup(false);
    setCapturedImage(null);
    setCapturedWithoutFace(false);
    setFaceDetected(false);
  }

  function lanjutDenganFoto() {
    if (!capturedImage) return;
    setShowNoFacePopup(false);
    onNext(capturedImage);
    setCurrentStep(2);
  }

  const siapDeteksi = cameraReady && detectorStatus === "ready" && !capturedImage;
  const borderClass = capturedImage
    ? capturedWithoutFace
      ? "border-4 border-amber-400"
      : "border-2 border-green-500"
    : !siapDeteksi
      ? "border-2 border-blue-400"
      : faceDetected
        ? "border-4 border-green-500 ring-4 ring-green-100"
        : "border-4 border-red-500 ring-4 ring-red-100";

  const canCapture = !!stream && cameraReady;

  return (
    <div className="w-full rounded-2xl bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-medium">Ambil Foto Selfie</h1>
        {!error && detectorStatus !== "error" && !capturedImage && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              !siapDeteksi
                ? "bg-blue-50 text-blue-600"
                : faceDetected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
            }`}>
            {!siapDeteksi
              ? "Menyiapkan..."
              : faceDetected
                ? "Wajah terdeteksi"
                : "Wajah tidak terdeteksi"}
          </span>
        )}
      </div>

      {error ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold transition-colors hover:bg-gray-100">
              Kembali
            </button>
            <button
              type="button"
              onClick={retryCamera}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
              <FiRefreshCw />
              Coba Lagi
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`relative h-72 w-full overflow-hidden rounded-2xl bg-black transition-all duration-200 ${borderClass}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={markVideoReady}
              onLoadedData={markVideoReady}
              onCanPlay={markVideoReady}
              onPlaying={markVideoReady}
              onResize={markVideoReady}
              className={`absolute inset-0 h-full w-full object-cover ${
                capturedImage ? "hidden" : "block"
              }`}
            />

            {/* Panduan bingkai wajah oval saat live preview */}
            {siapDeteksi && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-48 w-36 rounded-full border-2 border-dashed transition-colors duration-200 ${
                    faceDetected ? "border-green-400/90" : "border-red-400/90"
                  }`}
                />
              </div>
            )}

            {!cameraReady && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-white">
                Menyiapkan kamera...
              </div>
            )}

            {capturedImage && (
              <img
                src={capturedImage}
                alt="Selfie"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          {siapDeteksi && !faceDetected && (
            <p className="mt-2 text-center text-xs font-medium text-red-600">
              Posisikan wajah Anda dengan jelas di dalam bingkai kamera untuk
              mengambil foto.
            </p>
          )}

          {!capturedImage ? (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="w-full rounded-xl border border-gray-300 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Kembali
              </button>
              <button
                type="button"
                onClick={capture}
                disabled={!canCapture}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
                <CiCamera className="text-xl" />
                Ambil Foto
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={retake}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold transition-colors hover:bg-gray-100">
                Ulangi
              </button>

              <button
                type="button"
                onClick={lanjutDenganFoto}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
                Lanjut
              </button>
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {showNoFacePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="no-face-title"
          onClick={() => setShowNoFacePopup(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FaTriangleExclamation className="text-xl" />
            </div>
            <h2
              id="no-face-title"
              className="text-lg font-semibold text-gray-900">
              Wajah Tidak Terdeteksi
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Wajah Anda tidak terdeteksi jelas pada foto. Disarankan mengambil
              ulang foto dengan pencahayaan cukup, atau Anda tetap dapat
              melanjutkan.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={retake}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Ambil Ulang
              </button>
              <button
                type="button"
                onClick={lanjutDenganFoto}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                Tetap Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
