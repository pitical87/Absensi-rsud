import { useEffect, useRef, useState } from "react";
import { CiCamera } from "react-icons/ci";

type Props = {
  setCurrentStep: (step: number) => void;
  onNext: (image: string) => void;
};

export default function ValidateSelfie({ setCurrentStep, onNext }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let localStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStream = mediaStream;
        setStream(mediaStream);
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err.name === "NotAllowedError"
            ? "Izin kamera ditolak."
            : "Kamera tidak tersedia.",
        );
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  /**
   * Pasang stream ke video setiap kali video atau stream berubah.
   */
  useEffect(() => {
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
  }, [stream]);

  /**
   * Ketika user klik "Ulangi",
   * video muncul kembali dan play lagi.
   */
  useEffect(() => {
    if (capturedImage) return;
    if (!videoRef.current || !stream) return;

    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(() => {});
  }, [capturedImage, stream]);

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
  }

  function retake() {
    setCapturedImage(null);
  }

  return (
    <div className="w-full rounded-2xl bg-white p-4">
      <h1 className="mb-3 text-lg font-medium">Ambil Foto Selfie</h1>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="relative h-64 w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full rounded-xl border border-gray-300 bg-black object-cover ${
                capturedImage ? "hidden" : "block"
              }`}
            />

            {capturedImage && (
              <img
                src={capturedImage}
                alt="Selfie"
                className="absolute inset-0 h-full w-full rounded-xl border border-gray-300 object-cover"
              />
            )}
          </div>

          {!capturedImage ? (
            <div className="mt-4 flex items-center gap-3 ">
              <button
                onClick={() => setCurrentStep(0)}
                className="w-full rounded-xl border 
              border-gray-300 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                kembali
              </button>
              <button
                onClick={capture}
                disabled={!stream}
                className="
                flex w-full items-center justify-center gap-2 rounded-xl
                bg-blue-600 py-3 font-semibold text-white
                transition-colors
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:bg-gray-300
              ">
                <CiCamera className="text-xl" />
                Ambil Foto
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                onClick={retake}
                className="
                  flex-1 rounded-xl border border-gray-300 py-3
                  font-semibold transition-colors
                  hover:bg-gray-100
                ">
                Ulangi
              </button>

              <button
                onClick={() => {
                  if (capturedImage) onNext(capturedImage);
                  setCurrentStep(2);
                }}
                className="
                  flex-1 rounded-xl bg-blue-600 py-3
                  font-semibold text-white
                  transition-colors
                  hover:bg-blue-700
                ">
                Lanjut
              </button>
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
