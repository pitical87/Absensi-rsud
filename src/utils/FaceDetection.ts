import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detectorPromise: Promise<FaceDetector> | null = null;
let lastVideoTimestamp = -1;
let lastVideoTime = -1;
let lastDetectionResult = false;

async function createDetector(): Promise<FaceDetector> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

  // Gunakan CPU (XNNPACK WASM SIMD) agar bebas jeda kompilasi shader WebGL
  // di ponsel/Safari dan tidak memunculkan warning WebGL di console.
  return await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/mediapipe/blaze_face_short_range.tflite",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });
}

export function getFaceDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = createDetector().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
}

/**
 * Mulai unduh & inisialisasi WASM + model di latar belakang (mis. saat Step 0 GPS)
 * sehingga ketika masuk ke Step 1 Selfie deteksi wajah langsung siap tanpa tunggu.
 */
export function preloadFaceDetector(): void {
  getFaceDetector().catch(() => {});
}

export function resetFaceDetectionState(): void {
  lastVideoTime = -1;
  lastDetectionResult = false;
}

/**
 * Jalankan deteksi wajah pada elemen video yang sedang aktif.
 * Mengembalikan true jika ada minimal satu wajah utama (lebar >= 14% lebar video).
 */
export function detectFaceInVideo(
  detector: FaceDetector,
  video: HTMLVideoElement,
  force = false,
): boolean {
  if (
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return false;
  }

  // Lewati frame identik agar tidak membuang CPU di ponsel
  if (!force && video.currentTime === lastVideoTime) {
    return lastDetectionResult;
  }
  lastVideoTime = video.currentTime;

  // MediaPipe detectForVideo mewajibkan timestamp selalu bertambah (strictly increasing)
  const now = Math.floor(performance.now());
  const timestamp = now <= lastVideoTimestamp ? lastVideoTimestamp + 1 : now;
  lastVideoTimestamp = timestamp;

  const result = detector.detectForVideo(video, timestamp);
  const minFaceWidth = video.videoWidth * 0.14;

  lastDetectionResult = result.detections.some(
    (d) => (d.boundingBox?.width ?? 0) >= minFaceWidth,
  );

  return lastDetectionResult;
}
