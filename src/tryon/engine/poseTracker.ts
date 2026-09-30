import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { smoothLandmarks, type Landmark } from "./garmentFit";

// ponytail: keep in sync with node_modules/@mediapipe/tasks-vision/package.json — wasm and JS must match.
const TASKS_VISION_VERSION = "1.0.1";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
// Lite model (~5.8MB) keeps 25-30fps on mid-range Android; swap "lite"→"full" for steadier landmarks on desktop.
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

/** EMA factor: 1 = raw (jittery), 0.2 = very smooth (laggy). */
const SMOOTHING = 0.45;

export interface PoseTracker { stop(): void }

/**
 * MediaPipe's wasm writes its C++ glog lines ("W0925 20:16:31 … gl_context.cc:1119] …") to the
 * console through three sinks:
 *  - a global `dbg()` hook (else console.warn), e.g. "OpenGL error checking is disabled" and
 *    "Using NORM_RECT without IMAGE_DIMENSIONS…" (emitted inside Google's pose graph; not configurable);
 *  - `out`/`err`, which bind console.log/console.error once, when the wasm factory runs.
 * Known-benign INFO/WARNING lines are dropped; ERROR/FATAL and every non-glog message pass through.
 */
const GLOG = /^([IWEF])\d{4} [\d:.]+\s+\d+ [\w./-]+:\d+\]/;
const isNoise = (args: unknown[]) => {
  const level = GLOG.exec(String(args[0] ?? ""))?.[1];
  return level === "I" || level === "W";
};
const filtered = (sink: (...a: unknown[]) => void) => (...a: unknown[]) => { if (!isNoise(a)) sink(...a); };

async function createLandmarker(delegate: "GPU" | "CPU") {
  const g = globalThis as { dbg?: (...args: unknown[]) => void };
  g.dbg ??= filtered(console.warn.bind(console));
  // The wasm factory captures console.log/error while it boots; hand it filtered versions, then restore.
  const { log, error } = console;
  console.log = filtered(log.bind(console));
  console.error = filtered(error.bind(console));
  try {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  } finally {
    console.log = log;
    console.error = error;
  }
}

/**
 * Loads PoseLandmarker (GPU, falling back to CPU) and calls `onFrame` once per new video frame
 * with smoothed landmarks, or null when no person is in view. Rejects if the engine can't load.
 */
export async function startPoseTracker(
  video: HTMLVideoElement,
  onFrame: (landmarks: Landmark[] | null) => void,
): Promise<PoseTracker> {
  const landmarker = await createLandmarker("GPU").catch(() => createLandmarker("CPU"));

  let raf = 0;
  let stopped = false;
  let lastVideoTime = -1;
  let smoothed: Landmark[] | null = null;

  const tick = () => {
    if (stopped) return;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const pose = landmarker.detectForVideo(video, performance.now()).landmarks[0];
      smoothed = pose ? smoothLandmarks(smoothed, pose, SMOOTHING) : null;
      onFrame(smoothed);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      landmarker.close();
    },
  };
}
