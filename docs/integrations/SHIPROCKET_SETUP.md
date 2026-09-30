# Shiprocket setup and delivery promises

This guide covers obtaining credentials, checking delivery availability, and receiving shipment updates. Shiprocket calls belong on the server. Never put the API user password or bearer token in browser code, public environment variables, logs, or source control.

## 1. Create an API user and credentials

1. Sign in to the Shiprocket seller panel.
2. Open **Settings → API → Add New API User** (older panel/help wording is **Settings → API → Configure → Create an API User**).
3. Create a dedicated API user with a unique email address. Select only the modules required by this store and decide whether buyer details access is needed. The panel may show the generated password/API credential only once; store it immediately in the deployment secret manager.
4. Authenticate with `POST https://apiv2.shiprocket.in/v1/external/auth/login`, JSON `{ "email": "<api-user-email>", "password": "<api-user-password>" }`. Use the returned JWT as `Authorization: Bearer <token>` on subsequent API calls. Shiprocket documents a 10-day token validity; refresh before expiry and retry one time after an authorization failure.

The official API docs describe authenticated requests as affecting real account data. They do not document a generally available separate sandbox base URL or sandbox credential flow. Treat credentials as **production/live** unless Shiprocket has explicitly provisioned a test account for you. Test serviceability with non-mutating calls and a controlled account; do not test order creation, cancellation, or shipment actions against live credentials casually.

The product-page checker is now wired to `GET /api/shipping/serviceability?pincode=...`. It returns real serviceability, prepaid/COD support and a provider ETA range when configured; without credentials it returns an unavailable state and does not claim a delivery promise.

Recommended server secrets/configuration (these exact names are in `.env.example`):

```text
SHIPROCKET_API_EMAIL=        # dedicated API user
SHIPROCKET_API_PASSWORD=     # secret; server only
SHIPROCKET_PICKUP_POSTCODE=  # verified active pickup location PIN
SHIPROCKET_WEBHOOK_TOKEN=    # separate random webhook secret
```

Keep bearer tokens in a server-side encrypted cache with expiry (or obtain a fresh token on demand with sensible caching). Do not persist them in client storage or return them from an application API. Rotate the API user credential in Shiprocket and update the secret manager if it is exposed.

## 2. Check a delivery PIN

Shiprocket's courier serviceability endpoint is:

```http
GET https://apiv2.shiprocket.in/v1/external/courier/serviceability/
    ?pickup_postcode=<origin-pin>
    &delivery_postcode=<customer-pin>
    &weight=<kg>
    &cod=<0-or-1>
Authorization: Bearer <server-side-token>
```

`pickup_postcode` and `delivery_postcode` are required. Pass `weight` and `cod` together unless querying for an existing Shiprocket `order_id`; weight is in kilograms, `cod=1` asks for COD options and `cod=0` asks for prepaid. Optional package dimensions (`length`, `breadth`, `height`, centimetres) and `declared_value` make rate/serviceability results closer to the actual parcel. The response can include serviceable courier options, rates, and estimated delivery information. A PIN by itself is insufficient: serviceability depends on the configured pickup PIN, shipment weight and payment mode. COD availability must come from the COD query result, not a blanket UI claim.

### Product-page “Check delivery” integration

The former PIN-prefix mock has been removed from `src/views/product/components/DeliveryCheck.tsx`. That client calls the same-origin serviceability endpoint and only reports COD when Shiprocket returns COD-capable courier results for that PIN.

The app-owned route (do not proxy provider payloads or credentials) is:

```http
GET /api/shipping/serviceability?pincode=560034
```

```json
{
  "ok": true,
  "data": {
    "serviceable": true,
    "prepaidAvailable": true,
    "codAvailable": true,
    "estimatedDays": { "min": 4, "max": 6 }
  }
}
```

Returns `400` for invalid Indian PINs, `200` with `serviceable:false` when no eligible courier serves the route, and a generic `503` when the provider is unavailable. The current server uses `SHIPROCKET_PICKUP_POSTCODE`, queries both prepaid and COD serviceability, and caches a combined response in memory for 10 minutes. It currently uses a 0.5 kg apparel parcel estimate; configure product-specific weights/dimensions and recalculate at checkout before launch. The public route still needs a production-grade shared rate limiter. Returned delivery days are estimates, not a guarantee.

The current PDP is product-scoped; checkout should recalculate against the complete cart parcel and selected payment method. Only Shiprocket is currently wired. Other courier aggregators need separate server-side adapters and their own credentials.

## 3. Tracking and webhooks

Polling fallback: Shiprocket documents tracking by AWB or shipment ID under the **Tracking** section of its API reference. Use the authenticated server-side tracking endpoint after a shipment exists; polling should be throttled and limited to active shipments.

For push updates, configure a public HTTPS callback in **Settings → API → Webhooks**:

1. Enter the application's webhook callback URL and enable it.
2. Optionally set a random security token. Shiprocket sends this token as `x-api-key`; keep the matching value in `SHIPROCKET_WEBHOOK_TOKEN`.
3. Return HTTP `200` promptly for accepted events. The callback is a JSON `POST`.
4. Shiprocket's docs caution against callback URLs containing the words/fragments `shiprocket`, `kartrocket`, `sr`, or `kr`; use a neutral path such as `/api/hooks/courier-status`.

Verify the `x-api-key` using a constant-time comparison, validate the body, deduplicate events, and treat webhook payloads as untrusted input. Record the event before acknowledging it; perform email/other slow work asynchronously. Make status transitions monotonic so delayed events do not revert delivered shipments. Keep tracking polling as a reconciliation fallback.

## 4. Delivery copy and source of truth

Delivery copy is now derived from the serviceability response: the UI shows an estimated day range and only says COD is available when the COD query has a supported courier. Without keys it shows that live checking is unavailable. Checkout must recheck against the final cart and payment mode.

## Official Shiprocket references

- [Shiprocket API documentation](https://apidocs.shiprocket.in/) — Getting Started, Authentication API, Couriers → Check Courier Serviceability, Tracking, Webhooks, and API usage notes.
- [Shiprocket API developer portal](https://sr-website.shiprocket.in/developers/) — setup flow: panel → Settings → API → Configure → Create an API User.
- [Shiprocket API document helpsheet](https://support.shiprocket.in/support/solutions/articles/43000337456-shiprocket-api-document-helpsheet) — API user credentials, token generation, and 240-hour token validity.
