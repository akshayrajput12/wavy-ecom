# API reference

All implemented route handlers live under `src/app/api`. Shared success and error envelopes are provided by `src/backend/_core/http.ts`.

## Implemented routes

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | `/api/v1/tryon` | Advertises in-house browser-side try-on capability and privacy scope | Implemented |
| GET | `/api/v1/tryon/assets/{productId}` | Returns a registered overlay asset and calibration | Implemented; 404 when unmapped |
| GET | `/api/shipping/serviceability?pincode={pin}` | Checks delivery and COD availability through Shiprocket | Implemented when `SHIPROCKET_API_EMAIL`, `SHIPROCKET_API_PASSWORD`, and `SHIPROCKET_PICKUP_POSTCODE` are configured; otherwise 503 |
| GET, POST | `/api/tryon` | Legacy photo generation path | Disabled; returns 410 after input validation |

### Response envelope

Success: `{ "ok": true, "data": ... }`.

Error: `{ "ok": false, "error": { "code": "...", "message": "...", "details": ... } }`.

The shared route wrapper maps malformed JSON to 400, Zod validation to 422, `ApiError` to its declared status, and unexpected errors to a request-id-bearing 500 response.

## Planned backend routes

Commerce, account, fulfillment, analytics and admin APIs in `docs/CODEX_HANDOFF.md` §6 are implementation work, not live endpoints. In particular, do not integrate checkout clients against undocumented assumptions: `/api/checkout`, `/api/cart/quote`, `/api/payments/*`, `/api/orders/*`, `/api/returns`, `/api/track/*`, `/api/analytics/events` and `/api/admin/*` are not implemented yet.

When adding them, keep route handlers thin, use `route()` and Zod schemas, enforce customer/staff authorization in the service layer, and keep payment/provider secrets server-side. Money uses integer paise.
