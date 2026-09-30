# Virtual Try-On — Implementation

## Usage

```tsx
import { TryOnLauncher } from "@/tryon";
<TryOnLauncher product={product} />   // renders nothing unless product.tryOnEnabled
```

## How it works (Phase 1, on-device)

1. `components/TryOnLauncher.tsx` renders a secondary **Try it on** button and fires `try_on_opened`. The modal is loaded with `next/dynamic({ ssr: false })`, so MediaPipe (~12 MB wasm + ~6 MB model, fetched from jsDelivr / Google storage) never ships in the PDP bundle.
2. `components/TryOnModal.tsx` shows consent + privacy note ("processed on your device, nothing uploaded") before touching the camera. **Start camera** → `getUserMedia({ facingMode: "user" })`.
3. `engine/poseTracker.ts` loads `PoseLandmarker` (VIDEO mode, GPU delegate with CPU fallback, lite model) and runs `detectForVideo` once per new video frame via `requestAnimationFrame`. Landmarks are EMA-smoothed (`SMOOTHING = 0.45`) to cut jitter.
4. `engine/garmentFit.ts` (pure, unit-tested) turns landmarks into a 2D affine matrix: X axis = right→left shoulder (or hip) vector × `widthScale`, Y axis = shoulder-mid→hip-mid (or hip→knees/ankles) × `lengthScale`, plus offsets. This gives position, scale, rotation and shear (a cheap stand-in for perspective when leaning/turning). Returns `null` if an anchor's visibility < 0.5.
5. The overlay `<canvas>` (same intrinsic size as the video, both CSS-mirrored and `object-cover`) draws the garment with `ctx.setTransform(...matrix); ctx.drawImage(img, -0.5, 0, 1, 1)`.
6. **Save snapshot** composites mirrored video + overlay into a PNG and downloads it locally. Nothing is uploaded.
7. Closing (button, Esc, backdrop) stops the tracker and every camera track immediately.

States: `consent → starting → live`, errors split into **input/camera** (`denied`, `unsupported`, `camera_error`) vs **engine** (`engine_error`: wasm/model/overlay failed to load), each with its own copy and retry. Copy lives in `data/copy.ts`.

Analytics (`analytics.ts`, fire-and-forget `sendBeacon`/`fetch` to `/api/analytics/events`, silent on failure):
- `try_on_opened` — button click
- `try_on_started` — camera + engine live
- `try_on_completed` — first frame where the garment was fitted to the body (preview delivered)
- `try_on_failed` — `{ reason: denied | unsupported | camera_error | engine_error }`

Accessibility: `role="dialog"` + `aria-modal`, focus moves in and is trapped, Esc closes, focus returns to the launcher, labelled icon buttons, 44 px targets, `aria-live` status line, `useReducedMotion` disables the slide animation. The disclaimer **"Visual preview only — not a size or fit guarantee"** is always visible (PRD-006).

## Adding a product overlay

1. Asset → `public/tryon/<slug>.png` (or `.svg`):
   - transparent background, **front-facing flat-lay**, garment only (no hanger/model), centred horizontally
   - ~**1024 px** on the long side, PNG-24/WebP-lossless with alpha, < 300 KB
   - crop tight: collar/waistband at the top edge, hem at the bottom edge
2. Register it in `src/tryon/data/tryonAssets.ts` (key = product id **or** slug):
   ```ts
   "linen-camp-shirt": { src: "/tryon/linen-camp-shirt.png", type: "top",
     calibration: { widthScale: 2.0, lengthScale: 1.3, offsetY: -0.12, offsetX: 0 } },
   ```
3. Calibration knobs (all relative to the body, so they work at any distance):
   - `widthScale` — image width ÷ shoulder width (tops) or hip-joint width (bottoms). Sleeves/oversized fits → larger. Tee ≈ 2.0, hoodie ≈ 2.1, trousers ≈ 1.9 (hip landmarks are joints, narrower than the body).
   - `lengthScale` — image height ÷ shoulder→hip distance (tops) or hip→knee/ankle distance (bottoms). Cropped tee ≈ 1.1, longline ≈ 1.5.
   - `offsetY` — negative raises the image (collar sits above the shoulder joints: −0.1 to −0.2).
   - `offsetX` — horizontal nudge, in widths (usually 0).
   - `lengthTo` (bottoms) — `"knees"` for shorts, `"ankles"` for trousers.
4. Set `tryOnEnabled = true` on the product. A launcher appears only when a real product mapping exists; unmapped products no longer silently show the wrong tee overlay.

Tune by opening the modal and adjusting until the shoulder seams sit on the shoulders and the hem on the hips.

## Limitations

- 2D overlay: no cloth physics, no body-shape deformation, no occlusion (arms crossing in front are covered by the garment), side profiles degrade to a narrow sliver.
- Lighting/colour of the overlay doesn't match the room; flat-lay photos look pasted on.
- Needs shoulders + hips in frame (tops) or hips + ankles (trousers): users must step back ~1.5–2 m.
- Requires HTTPS, WebGL2 for GPU (CPU fallback is slower), a front camera. Low-end devices may drop to ~15 fps.
- Mirrored preview: prints/logos appear reversed, like a real mirror (snapshot keeps the mirrored view).

## Sneakers

Not covered by Phase 1. MediaPipe Pose gives heel/toe points but no reliable foot rotation, and a 2D sticker on feet looks wrong. Options (see RESEARCH.md): 3D product viewer + AR Quick Look / Scene Viewer (free, needs GLB/USDZ per SKU), or a foot-tracking vendor (Perfect Corp/WANNA, Snap Camera Kit). Keep `tryOnEnabled = false` for sneakers until then.

## Privacy & retention

Phase 1: camera frames are processed in the browser memory only; no frames, landmarks or snapshots leave the device. Analytics events carry product id and outcome only. Camera stops on close/unmount. No retention needed.

Photo generation is disabled. No source photo is sent to a provider.

## Versioned API and current no-cost scope

`GET /api/v1/tryon` reports the first-party on-device capability contract; `GET /api/v1/tryon/assets/{productId}` returns registered overlay metadata. The legacy `/api/tryon` multipart photo-job endpoint is disabled and returns 410. The FASHN adapter is not called. See [TRYON_V1.md](../api/TRYON_V1.md).

The current in-house option is live 2D garment overlay with browser-side MediaPipe pose tracking. It costs no per-session inference fee and sends no camera frames to a server. It does not provide photorealistic cloth synthesis. The model/WASM download still comes from public CDNs; copy pinned licensed model files into `public/tryon/models/` to remove that runtime CDN dependency.

## Later option — photo synthesis (out of scope and disabled)

Compatibility behavior:
- `src/app/api/tryon/route.ts` validates photo-job requests, then returns 410 `photo_generation_disabled`.
- The server-side provider adapter has been removed; no third-party try-on integration can be called.

Any future photo-synthesis implementation needs an explicitly approved provider or commercially licensed self-hosted model, `tryon_sessions` with RLS, private storage, signed URLs, TTL cleanup, a per-user limit, an admin switch and an upload consent flow. No such code or provider is active now.

## Pose guide and engine logs (2026-09-26)
- `components/PoseGuide.tsx` draws a body outline (bust for tops, full figure for bottoms). `engine/framing.ts` compares the live landmarks with it and returns one hint: step into the outline, move left/right, closer or back, show hips or legs, or aligned. After about 0.9s aligned the outline fades out. If the person is lost for about 1.2s it comes back. The target sizes (`GUIDE_TARGET`) must match the outline drawing.
- The modal is full-screen on phones (camera, then a panel below) and a two-column dialog from `md` upwards.
- MediaPipe's C++ INFO/WARNING log lines (`gl_context.cc`, `landmark_projection_calculator.cc` "NORM_RECT without IMAGE_DIMENSIONS") are filtered in `engine/poseTracker.ts`. ERROR/FATAL lines still reach the console. The NORM_RECT warning comes from inside Google's pose graph and the public API has no option for it.
