import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detectorPromise: Promise<FaceDetector> | null = null;
let lastVideoTimestamp = -1;

async function createDetector(): Promise<FaceDetector> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

  try {
    return await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.55,
    });
  } catch {
    // Fallback ke CPU jika WebGL/GPU tidak tersedia pada perangkat
    return await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/blaze_face_short_range.tflite",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.55,
    });
  }
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
 * Jalankan deteksi wajah pada elemen video yang sedang aktif.
 * Mengembalikan true jika ada minimal satu wajah utama (lebar >= 14% lebar video).
 */
export function detectFaceInVideo(
  detector: FaceDetector,
  video: HTMLVideoElement,
): boolean {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return false;
  }

  // MediaPipe detectForVideo mewajibkan timestamp selalu bertambah (strictly increasing)
  const now = Math.floor(performance.now());
  const timestamp = now <= lastVideoTimestamp ? lastVideoTimestamp + 1 : now;
  lastVideoTimestamp = timestamp;

  const result = detector.detectForVideo(video, timestamp);
  const minFaceWidth = video.videoWidth * 0.14;

  return result.detections.some(
    (d) => (d.boundingBox?.width ?? 0) >= minFaceWidth,
  );
}
