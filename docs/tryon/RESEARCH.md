# Virtual Try-On — Options Research (Sept 2026)

Goal: shopper taps **Try it on** on a PDP → live camera → garment follows them in real time. Free or near-free.
Requirements carried from specs: PRD-006 / FR-024 (visual assistance only, validate input, processing/result/failure states, "not a size or fit guarantee" disclaimer), Data/API §4 (upload/queued/processing/completed/failed/expired states, access-controlled assets, usage/cost metadata).

## Comparison

"Cost / 1k" assumes 1 try-on = 1 session (live) or 1 generated image (generative).

| Option | Quality | Real-time? | Cost / 1k try-ons | 10k / mo | 100k / mo | Privacy | Effort |
|---|---|---|---|---|---|---|---|
| **(a) MediaPipe Pose on-device + 2D garment warp** | Low–medium (flat overlay, no cloth physics/occlusion) | Yes, 25–30 fps mid phones (lite model) | **$0** (model ~6 MB from Google storage, wasm ~12 MB from jsDelivr — both free CDNs) | $0 | $0 | Best: frames never leave device | Low (done — Phase 1) |
| (b) Snap Camera Kit (Web) | High for AR lenses (3D body mesh, garment lenses) | Yes | $0 SDK licence (application/approval required); cost is building each garment as a Lens in Lens Studio | $0 + lens production | $0 + lens production | On-device | High: per-SKU 3D/lens work, Snap approval, Snap branding terms |
| (b) DeepAR Web SDK | Medium–high (mostly face/beauty; body limited) | Yes | MAU-priced: free ≤10 MAU (watermark), $25 ≤1k, $100 ≤5k, $500 ≤30k, $1,000 ≤100k MAU | ~$500 | ~$1,000 | On-device | Medium; weak for full-body apparel |
| (b) Banuba (Face AR SDK / TINT) | High for face/accessories; apparel via TINT | Partly | Custom MAU quote (Face AR SDK); TINT no-code VTO $49–$349/mo, Shopify $319–$1,599/mo | quote | quote | Depends on product | Medium, vendor lock-in |
| (b) Perfect Corp / YouCam (incl. WANNA, acquired 2025) | High; best-in-class **shoe/watch AR** | Yes (AR shoes), GenAI clothes = image | Enterprise quote only (not public) | quote | quote | Vendor cloud for GenAI | Medium, enterprise sales cycle |
| (c) **FASHN.ai API** (tryon-v1.6) | Very high photoreal | No (~5–15 s/image) | $75 on-demand ($0.075); tiers $67.5 / $60 / $48.8 | $750 (≈$488 Tier III) | $7,500 (≈$4,880 Tier III, <$0.04 at commitments) | Photo sent to vendor | Low (adapter scaffolded) |
| (c) Google Vertex AI Virtual Try-On | High, good shoes support | No (seconds) | ~$60 ($0.06/image); model marked deprecating 2027-03-15 | $600 | $6,000 | Google Cloud, enterprise terms | Low–medium (GCP auth) |
| (c) Kling Kolors VTON (via fal / PiAPI) | High | No | ~$70 ($0.07/image), prepaid from ~$0.049 | $700 | $4,900–7,000 | Photo sent to vendor (CN-origin model) | Low |
| (c) Replicate IDM-VTON | High | No (~17 s on A100) | ~$24 ($0.024/run) | $240 | $2,400 | Photo sent to Replicate | Low — **but CC BY-NC-SA, non-commercial only** |
| (c) Replicate CatVTON-Flux | High | No | ~$150 ($0.15/run) | $1,500 | $15,000 | Photo to Replicate | Low; licence check needed |
| (d) Self-host IDM-VTON / OOTDiffusion / CatVTON | High | No (5–20 s) | GPU: RunPod L40S $0.99/h ≈ 300–400 img/h → **$2.5–3.5 compute**; always-on pod ≈ $725/mo; serverless A100 $2.72/h | ~$30 serverless (+cold starts) or $725 always-on | ~$300 serverless / 1 pod | Your infra | High (MLOps, queue, scaling) — and **all three are CC BY-NC-SA → not usable commercially** without a separate licence |
| (e) Sneakers: WANNA / Perfect Corp AR shoes, Snap foot tracking | High (foot tracking + 3D shoe) | Yes | Enterprise quote; Snap free but per-SKU 3D model + lens | quote | quote | On-device | High: needs a 3D (GLB/USDZ) model per shoe |

Notes
- MediaPipe Pose has no foot-orientation landmarks beyond heel/toe points; a 2D sneaker sticker at the ankles looks poor. Real sneaker AR needs foot tracking + 3D models (WANNA, Snap). Cheapest credible sneaker path: `<model-viewer>` 3D + iOS Quick Look / Android Scene Viewer "view in your room" (free, needs GLB/USDZ per SKU), not on-foot.
- Open-source VTON quality leaders (IDM-VTON, OOTDiffusion, CatVTON) are research licences; commercial use means a paid API or licensing.
- Prices from vendor pages / aggregators Sept 2026; generative prices trend down ~30–50 %/yr.

## Recommendation

**Current implementation: free on-device live overlay** — MediaPipe PoseLandmarker in the browser, 2D affine warp of a transparent flat-lay garment image anchored to shoulders/hips (tops) or hips/knees/ankles (bottoms). $0 per session, no uploads, lazy-loaded, and exposed through `/api/v1/tryon` capability and asset endpoints. Only explicitly mapped products are enabled. Honest positioning: "visual preview", as the spec requires. This is not generative garment replacement.

**Photo try-on is disabled.** The old provider adapter is not connected to public routes; `/api/tryon` rejects photo jobs with 410 and no third-party generation request is made. Re-enable a commercial provider only after explicit product approval and privacy/retention work.

Cost summary

| Monthly try-ons | Phase 1 (on-device) | Phase 2 FASHN on-demand | Phase 2 FASHN Tier III | Vertex |
|---|---|---|---|---|
| 10k | $0 | $750 | $488 | $600 |
| 100k | $0 | $7,500 | $4,880 | $6,000 |

Realistic blend: Phase 2 capped to ~10 % of live sessions → 100k live + 10k HD ≈ **$500–750/mo**.

## Sources
- FASHN API pricing: https://help.fashn.ai/plans-and-pricing/api-pricing , https://fashn.ai/blog/pricing-update-for-developer-api
- Vertex AI Virtual Try-On: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/virtual-try-on-preview-08-04 , https://cloudprice.net/models/google-virtual-try-on-1
- Replicate IDM-VTON: https://replicate.com/cuuupid/idm-vton ; CatVTON-Flux: https://replicate.com/mmezhov/catvton-flux
- Kling Kolors VTON: https://fal.ai/models/fal-ai/kling/v1-5/kolors-virtual-try-on , https://piapi.ai/docs/kling-api/virtual-try-on-api
- DeepAR pricing: https://docs.deepar.ai/deepar-sdk/pricing/
- Banuba: https://www.banuba.com/blog/banuba-tint-virtual-try-on-pricing-guide , https://www.banuba.com/blog/banuba-face-ar-sdk-pricing-guide
- Snap Camera Kit: https://ar.snap.com/camera-kit , https://developers.snap.com/camera-kit/home
- Perfect Corp / WANNA shoes: https://www.perfectcorp.com/business/showcase/footwear , https://wanna.fashion/footwear
- RunPod GPU pricing: https://www.runpod.io/pricing
- Open-source VTON comparison / licences: https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models , https://fitroom.app/blog/open-source-vton-models-vs-managed-apis
