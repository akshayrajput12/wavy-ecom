"use client";

import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Download, MoveHorizontal, ScanLine, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { track } from "../analytics";
import { tryOnCopy as copy } from "../data/copy";
import type { TryOnAsset } from "../data/tryonAssets";
import { coverRect, framingHint, type FramingHint } from "../engine/framing";
import { computeGarmentFit, type Landmark } from "../engine/garmentFit";
import { startPoseTracker, type PoseTracker } from "../engine/poseTracker";
import { PoseGuide } from "./PoseGuide";

type ErrorPhase = keyof typeof copy.errors;
type Phase = "consent" | "starting" | "live" | ErrorPhase;

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
/** ms the shopper must hold the aligned pose before the guide fades out; ms of lost tracking before it returns. */
const LOCK_AFTER = 900;
const UNLOCK_AFTER = 1200;

function cameraErrorPhase(e: unknown): ErrorPhase {
  const name = e instanceof DOMException ? e.name : "";
  return name === "NotAllowedError" || name === "SecurityError" ? "denied" : "camera_error";
}

export function TryOnModal({ productId, productName, asset, garmentColor, onClose }: {
  productId: string; productName: string; asset: TryOnAsset; garmentColor?: string; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("consent");
  const [hint, setHint] = useState<FramingHint>("no_person");
  const [locked, setLocked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);
  const frame = useRef({ hint: "no_person" as FramingHint, locked: false, since: 0, fitted: false });

  const stopCamera = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; stopCamera(); };
  }, [stopCamera]);

  const close = () => { stopCamera(); onClose(); };

  const fail = (p: ErrorPhase, e: unknown) => {
    stopCamera();
    setPhase(p);
    track("try_on_failed", { productId, reason: p, error: e instanceof Error ? e.name : "unknown" });
  };

  /** Guide state machine: aligned for LOCK_AFTER → hide guide; person lost for UNLOCK_AFTER → show it again. */
  const updateFraming = (next: FramingHint) => {
    const f = frame.current, now = performance.now();
    if (next !== f.hint) { f.hint = next; f.since = now; setHint(next); }
    const held = now - f.since;
    if (!f.locked && next === "aligned" && held > LOCK_AFTER) { f.locked = true; setLocked(true); }
    if (f.locked && next === "no_person" && held > UNLOCK_AFTER) { f.locked = false; setLocked(false); }
  };

  const draw = (img: HTMLImageElement) => (lms: Landmark[] | null) => {
    const video = videoRef.current, canvas = canvasRef.current, stage = stageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!video || !canvas || !ctx || !stage) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fit = lms && computeGarmentFit(lms, asset.type, asset.calibration, canvas.width, canvas.height);
    if (fit) {
      ctx.setTransform(...fit.matrix);
      ctx.drawImage(img, -0.5, 0, 1, 1);
      if (garmentColor) {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = garmentColor;
        ctx.fillRect(-0.5, 0, 1, 1);
        ctx.globalCompositeOperation = "source-over";
      }
      if (!frame.current.fitted) { frame.current.fitted = true; track("try_on_completed", { productId }); }
    }
    const view = coverRect(video.videoWidth, video.videoHeight, stage.clientWidth, stage.clientHeight);
    updateFraming(framingHint(lms, asset.type, view));
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return fail("unsupported", null);
    setPhase("starting");
    frame.current = { hint: "no_person", locked: false, since: performance.now(), fitted: false };
    setHint("no_person");
    setLocked(false);
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        // Portrait on phones so object-cover keeps the torso; desktops return their native landscape.
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } }, audio: false,
      });
      const video = videoRef.current!;
      video.srcObject = streamRef.current;
      await video.play();
    } catch (e) { return fail(cameraErrorPhase(e), e); }
    try {
      const img = new Image();
      img.src = asset.src;
      await img.decode();
      trackerRef.current = await startPoseTracker(videoRef.current!, draw(img));
      setPhase("live");
      track("try_on_started", { productId, garment: asset.type });
    } catch (e) { fail("engine_error", e); }
  };

  const snapshot = () => {
    const video = videoRef.current, overlay = canvasRef.current;
    if (!video || !overlay) return;
    const out = document.createElement("canvas");
    out.width = video.videoWidth; out.height = video.videoHeight;
    const ctx = out.getContext("2d")!;
    ctx.translate(out.width, 0); ctx.scale(-1, 1); // match the mirrored preview
    ctx.drawImage(video, 0, 0); ctx.drawImage(overlay, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `wavy-tryon-${productId}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key !== "Tab" || !dialogRef.current) return;
    const els = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!els.length) return;
    const [first, last] = [els[0], els[els.length - 1]];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const error = phase in copy.errors ? copy.errors[phase as ErrorPhase] : null;
  const camera = phase === "live" || phase === "starting";
  const statusText = phase === "starting" ? copy.status.starting : locked ? copy.status.tracking : copy.hints[hint];
  const fade = { duration: reduce ? 0 : 0.22 };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/70 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tryon-title" onKeyDown={onKeyDown}
        className="flex h-dvh w-full flex-col overflow-hidden bg-canvas shadow-lg md:h-[min(88dvh,780px)] md:max-w-5xl md:flex-row md:rounded-lg"
        initial={reduce ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }} transition={{ ...fade, duration: reduce ? 0 : 0.3 }}
      >
        {/* Stage */}
        <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-black">
          <video ref={videoRef} playsInline muted aria-hidden
            className={clsx("absolute inset-0 size-full -scale-x-100 object-cover", !camera && "hidden")} />
          <canvas ref={canvasRef} aria-hidden
            className={clsx("absolute inset-0 size-full -scale-x-100 object-cover", phase !== "live" && "hidden")} />
          {!error && <PoseGuide type={asset.type} hint={phase === "live" ? hint : "no_person"} locked={phase === "live" && locked} idle={phase === "consent"} />}

          {/* top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-linear-to-b from-black/60 to-transparent p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <span className={clsx("inline-flex items-center gap-2 rounded-pill bg-black/50 px-3 py-1 text-micro font-semibold uppercase tracking-wide text-on-dark", phase !== "live" && "invisible")}>
              <span className="size-2 rounded-full bg-danger motion-safe:animate-pulse" aria-hidden /> {copy.live}
            </span>
            <button type="button" onClick={close} aria-label={copy.close}
              className="grid size-11 place-items-center rounded-pill bg-black/50 text-on-dark hover:bg-black/70">
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {/* consent / starting / error overlays */}
          {phase === "consent" && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-linear-to-t from-black/80 via-black/50 to-transparent p-6 pb-8 text-center text-on-dark">
              <p className="t-h3 max-w-sm">{copy.intro}</p>
              <p className="t-meta max-w-sm text-on-dark/80">{copy.privacy}</p>
              <Button variant="accent" size="lg" onClick={start}>{copy.start}</Button>
            </div>
          )}
          {phase === "starting" && (
            <div className="absolute inset-0 grid place-items-center">
              <ScanLine className="size-10 text-on-dark motion-safe:animate-pulse" aria-hidden />
            </div>
          )}
          {error && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink p-6 text-center text-on-dark">
              <p className="t-h3">{error.title}</p>
              <p className="max-w-sm text-body text-on-dark/80">{error.body}</p>
              {phase !== "unsupported" && <Button variant="accent" onClick={start}>{copy.retry}</Button>}
            </div>
          )}

          {/* live hint chip */}
          {camera && (
            <p role="status" aria-live="polite"
              className={clsx(
                "absolute inset-x-4 bottom-4 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-pill px-4 py-2.5 text-body font-medium shadow-md transition-colors",
                hint === "aligned" || locked ? "bg-success text-on-dark" : "bg-surface text-ink",
              )}>
              {hint === "aligned" || locked
                ? <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                : <MoveHorizontal className="size-4 shrink-0" aria-hidden />}
              {statusText}
            </p>
          )}
        </div>

        {/* Side panel (below the stage on phones) */}
        <aside className="flex shrink-0 flex-col gap-4 border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:w-[340px] md:border-l md:p-6">
          <div>
            <p className="t-overline text-ink-soft">{copy.title}</p>
            <h2 id="tryon-title" className="t-h2">{productName}</h2>
          </div>
          <ol className="hidden flex-col gap-3 md:flex">
            {copy.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-body text-ink-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-surface-warm text-micro font-semibold text-ink">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-auto flex flex-col gap-3">
            {phase === "live" && (
              <Button variant="primary" full onClick={snapshot}>
                <Download className="size-4" aria-hidden /> {copy.snapshot}
              </Button>
            )}
            <p className="t-meta text-ink">{copy.disclaimer}</p>
            <p className="t-meta hidden md:block">{copy.privacy}</p>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}
