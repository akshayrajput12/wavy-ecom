# In-house Try-on API v1

The current try-on is a first-party, browser-side feature. Pose inference uses MediaPipe Tasks Vision and garment overlays use the local SVG/PNG assets in `public/tryon`. Camera frames and snapshots stay on the shopper's device. No paid inference API is called.

Base path: `/api/v1/tryon`.

## `GET /api/v1/tryon`

Returns supported capabilities and the privacy contract.

```json
{
  "ok": true,
  "data": {
    "apiVersion": "v1",
    "mode": "on-device-live-overlay",
    "provider": "mediapipe-pose-landmarker",
    "uploadsPhotos": false,
    "paidProviderRequired": false,
    "limitations": ["2d-garment-overlay", "no-cloth-physics", "visual-preview-only"]
  }
}
```

## `GET /api/v1/tryon/assets/{productId}`

Returns a registered garment overlay and calibration. Unknown product ids return a typed 404. The endpoint serves only first-party assets; it does not start inference.

## Browser integration

Import `TryOnLauncher` from `@/tryon` and pass the product. Only products with `tryOnEnabled` and a registered asset display the launcher. The camera is requested only after the shopper accepts the prompt. `getUserMedia` requires HTTPS (localhost is allowed). Closing the modal stops every camera track.

## Photo generation compatibility route

`/api/tryon` remains as a compatibility route. POST validates multipart input and returns `410 photo_generation_disabled`; GET returns the same code. No third-party provider is contacted. The in-house experience is live camera overlay rather than server-side photo synthesis.

## Error shape

All errors use `{ "ok": false, "error": { "code", "message", "details" } }`. Invalid payloads return 422; unknown asset ids return 404.

## Limits

This is a visual 2D overlay, not a photorealistic garment replacement, fit guarantee, or size recommendation. It currently supports explicitly mapped upper-body and trouser assets. Unmapped products do not show a try-on button. Pose model/WASM assets are fetched from their configured public CDNs on first use; pinning them locally under `public/` is the next step for fully self-hosted delivery.
