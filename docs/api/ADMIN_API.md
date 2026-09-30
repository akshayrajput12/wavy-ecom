# Admin API status

The admin console currently uses demo data and client-side optimistic updates. There are no implemented `/api/admin/**` mutation handlers yet. The `adminApi` client helper's old 404 shortcut is transitional and does not make mutations persistent.

## Required implementation rules

The route plan and permissions are tracked in `docs/CODEX_HANDOFF.md` §6 and `docs/database/RBAC.md`.

- Gate every mutation with `requirePermission()` for the specific resource/action.
- Validate request bodies with Zod and return the common API envelope.
- Use the request-scoped Supabase client for RLS-bound operations; use service-role operations only after explicit server-side authorization.
- Write security-sensitive changes to the immutable audit log.
- Never disable the final enabled payment gateway or demote the final super admin.
- Review moderation must not set verified purchase status; the database owns that value.
- Upload media through signed URLs; never expose integration secrets to the browser.

## Planned resource groups

Catalog and inventory; orders and returns; reviews and testimonials; coupons, offers and campaigns; tax, shipping and payment gateways; SEO, blog and media; staff, settings, integration checks and audit log. Each group needs a documented request/response schema and permission before the UI's TODO call sites are considered complete.

This file is a status document, not a claim that those endpoints exist.
