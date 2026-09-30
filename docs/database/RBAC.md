# wavy: roles, permissions and staff accounts

## Model

- **`profiles.role`** is the *effective* role of a user. Postgres enum `user_role`: customer, super_admin, catalog_manager, order_manager, marketing_manager, analyst, support_agent.
- **`permissions`** lists capability codes. **`role_permissions`** maps each role to its codes. Both are reference data that the migrations insert (`0002_identity_rbac.sql`), so they exist in every environment.
- **`src/backend/_core/permissions.ts`** holds the same map as a TS const for UI and API gating. Nothing checks them automatically, so review both together. To change a role, edit **both** in the same PR: add a new migration that inserts or deletes `role_permissions` rows, and update the TS map.
- **`staff_members`** is the staff lifecycle (`invited → active → suspended`). A trigger (`sync_staff_role`) is the only thing that changes `profiles.role`:
  - `active` → `profiles.role = staff_members.role`
  - `invited` or `suspended`, or the staff row is deleted → `profiles.role = 'customer'`
  - A direct `update profiles set role = …` fails: the column has no client grant and a guard trigger rejects it.
- **DB checks:** `has_permission('orders.refund')` (SECURITY DEFINER, STABLE, `search_path=''`) reads `profiles` and `role_permissions` for `auth.uid()`. `super_admin` always returns true. RLS policies call it as `(select public.has_permission('…'))` so it is evaluated once per statement. `auth_role()` returns the current effective role.
- **JWT:** `custom_access_token_hook` adds the claim `user_role` to every access token. The app can use it for fast routing (`src/proxy.ts`, admin layout), but the database never trusts it and always re-checks `profiles`. Role changes reach the JWT on the next token refresh (at most 1 hour). RLS applies them immediately.
- **Service role** (backend: checkout, webhooks, cron, ingestion) bypasses RLS. Sensitive RPCs (`place_order`, `mark_payment_captured`, …) are executable **only** by `service_role`.

Enable the hook in `supabase/config.toml`, which a migration cannot change:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

On hosted Supabase, go to Dashboard → Authentication → Hooks → Custom Access Token and select `public.custom_access_token_hook`.

## What each role can do

| Permission | super_admin | catalog_manager | order_manager | marketing_manager | analyst | support_agent |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| catalog.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| catalog.write / catalog.publish | ✓ | ✓ | | | | |
| inventory.read | ✓ | ✓ | ✓ | | | |
| inventory.write | ✓ | ✓ | | | | |
| orders.read | ✓ | | ✓ | | ✓ | ✓ |
| orders.write / orders.refund / shipments.write | ✓ | | ✓ | | | |
| returns.read / returns.write | ✓ | | ✓ | | | ✓ |
| customers.read / journey.read | ✓ | | ✓ | | | ✓ |
| customers.write (block/unblock) | ✓ | | | | | |
| payments.read (attempts, events, refunds) | ✓ | | ✓ | | | ✓ |
| payments.gateway.manage (enable/disable Razorpay/PayU/COD) | ✓ | | | | | |
| marketing.read | ✓ | | | ✓ | ✓ | |
| coupons.write / offers.write / campaigns.write | ✓ | | | ✓ | | |
| testimonials.write / content.write / blog.write / blog.publish | ✓ | | | ✓ | | |
| seo.write | ✓ | ✓ | | ✓ | | |
| reviews.moderate | ✓ | ✓ | | ✓ | | |
| analytics.read | ✓ | | | ✓ | ✓ | |
| tryon.read (usage metadata only, never photos) | ✓ | ✓ | | | ✓ | |
| support.read / support.write | ✓ | | read only | | | ✓ |
| settings.read | ✓ | | ✓ | | | |
| settings.shipping.manage (zones, methods, COD fee) | ✓ | | ✓ | | | |
| settings.write / settings.tax.manage / integrations.manage | ✓ | | | | | |
| staff.manage / audit.read | ✓ | | | | | |

A **customer** has no permissions. RLS lets a customer read and write only their own rows: profile (name, phone, avatar and marketing opt-in only), addresses, wishlist, cart, orders (read), payments (read), returns (create and read), reviews (create and edit, which sends the review back to moderation), support tickets, and their own try-on sessions and files.

## What happens when a customer signs up

`auth.users` INSERT fires `on_auth_user_created` → `handle_new_user()`:

1. It inserts `profiles` with `id = auth.users.id`, `email`, `full_name` (from `raw_user_meta_data.full_name` or `name`, truncated to 120 characters), `phone` (only if it is a valid 10–15 digit number), `avatar_url` and `marketing_opt_in`. It sets **`role = 'customer'` and `status = 'active'`**.
2. It **never** reads a role from user metadata. Clients control metadata at signup, so trusting it would allow privilege escalation.
3. If a pending `staff_members` invite exists for the same email (case-insensitive), it links `user_id`. The user stays `customer` until the invite becomes `active`.
4. The first access token carries `user_role: "customer"`.

Guest orders are **not** linked to a new account automatically, because the email may not be verified yet. If you want linking, do it in the backend after email confirmation (`update orders set user_id = … where lower(email) = … and user_id is null`).

## How to create staff users

### A. Bootstrap the first super admin (once per environment)

1. The person signs up normally, or you create them under Dashboard → Authentication → Users → "Add user".
2. In the SQL editor (runs as `postgres`):

   ```sql
   select public.bootstrap_super_admin('founder@wavy.store');
   -- creates or updates staff_members(role = super_admin, status = active) and sets profiles.role
   select id, email, role from public.profiles where email = 'founder@wavy.store';
   ```

   `bootstrap_super_admin` is executable only by `postgres` and `service_role`.

### B. Invite staff from the admin console (normal flow)

The backend route runs with the service role after checking `can(role, "staff.manage")`:

1. Create the invite record:

   ```sql
   insert into public.staff_members (email, full_name, role, invited_by)
   values ('ops@wavy.store', 'Ops Lead', 'order_manager', auth.uid());   -- status = 'invited'
   ```

2. Send the auth invite: `supabase.auth.admin.inviteUserByEmail('ops@wavy.store', { redirectTo: '<site>/admin' })`. This creates the `auth.users` row. The signup trigger creates the profile (`customer`) and links `staff_members.user_id`.
3. The invitee clicks the link and signs in. `auth.users.last_sign_in_at` changes, `handle_user_updated()` sets the invite to `active`, and `profiles.role` becomes `order_manager`.
4. Their next token refresh carries `user_role: "order_manager"`. RLS permissions apply immediately.

If the person already has an account (for example a customer), step 1 links it by email right away. Skip step 2, because `inviteUserByEmail` fails for existing users. Their next sign-in activates the invite. To activate immediately:

```sql
update public.staff_members set status = 'active' where lower(email) = 'ops@wavy.store';
```

### C. Change role, suspend, reactivate, remove

```sql
update public.staff_members set role = 'support_agent' where lower(email) = 'ops@wavy.store';   -- role change
update public.staff_members set status = 'suspended', suspended_reason = 'left company'
 where lower(email) = 'ops@wavy.store';                                                         -- instantly customer
update public.staff_members set status = 'active' where lower(email) = 'ops@wavy.store';        -- restore
delete from public.staff_members where lower(email) = 'ops@wavy.store';                         -- demote to customer
```

Every change to `staff_members`, `role_permissions` and `profiles.role` or `profiles.status` is written to `audit_logs`. To force the change into the JWT at once instead of at the next refresh, the backend can call `supabase.auth.admin.signOut(userId)`.

## Storage access

| Bucket | Public | Who can read | Who can write |
|---|---|---|---|
| product-media | yes | everyone | `catalog.write` |
| review-media | no | owner, `reviews.moderate`, anyone once the review is approved | owner (`<uid>/<review_id>/…`) |
| tryon-private | no | owner only. Anonymous try-on goes through backend signed URLs | owner (`<uid>/<session_id>/…`) |
| return-evidence | no | owner, `returns.read` | owner (`<uid>/<return_id>/…`) |
