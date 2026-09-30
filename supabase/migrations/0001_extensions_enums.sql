-- =============================================================================
-- 0001 — Extensions, enums and shared helpers
-- Enum values for domain states MUST match src/types/domain.ts exactly.
-- Money is always integer paise (Rs 1 = 100). Timestamps are timestamptz.
-- =============================================================================

create schema if not exists extensions;
-- Trigram search on names / SKUs / emails / order numbers (admin search boxes).
create extension if not exists pg_trgm with schema extensions;

-- ---------- Domain enums (mirror src/types/domain.ts) ----------
create type public.product_status  as enum ('draft', 'published', 'unpublished', 'archived');
create type public.variant_status  as enum ('active', 'out_of_stock', 'disabled');
create type public.order_status    as enum ('pending_payment', 'paid', 'processing', 'packed', 'shipped',
                                            'delivered', 'cancelled', 'return_requested', 'returned', 'refunded');
create type public.payment_status  as enum ('initiated', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
create type public.shipment_status as enum ('created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled');
create type public.return_status   as enum ('requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'refunded', 'closed');
create type public.review_status   as enum ('pending', 'approved', 'rejected', 'hidden');
create type public.coupon_status   as enum ('draft', 'active', 'paused', 'expired', 'archived');
create type public.campaign_status as enum ('draft', 'scheduled', 'live', 'paused', 'completed', 'archived');
create type public.integration_status as enum ('connected', 'needs_attention', 'disconnected');
create type public.tryon_status    as enum ('created', 'uploading', 'queued', 'processing', 'completed', 'failed', 'expired', 'deleted');
create type public.user_role       as enum ('customer', 'super_admin', 'catalog_manager', 'order_manager',
                                            'marketing_manager', 'analyst', 'support_agent');
create type public.payment_provider as enum ('razorpay', 'payu', 'cod');

-- ---------- Schema-internal enums ----------
create type public.account_status as enum ('active', 'blocked', 'deleted');
create type public.staff_status   as enum ('invited', 'active', 'suspended');
create type public.payment_method as enum ('card', 'upi', 'netbanking', 'wallet', 'emi', 'paylater', 'cod');
create type public.gateway_mode   as enum ('test', 'live');
-- One row per try at paying. 'duplicate' = a second successful capture for an already-paid order (must be refunded).
create type public.payment_attempt_status as enum ('created', 'checkout_opened', 'pending', 'authorized', 'captured',
                                                   'failed', 'cancelled', 'duplicate');
-- WHERE in the pipeline a payment failed: the first thing support reads.
create type public.payment_failure_stage as enum (
  'order_creation',      -- provider order could not be created (our side / gateway API down)
  'checkout_open',       -- checkout widget failed to open / script blocked
  'user_cancelled',      -- customer closed the checkout
  'bank_declined',       -- issuer declined
  'otp_timeout',         -- 3DS / UPI collect not completed in time
  'insufficient_funds',
  'signature_mismatch',  -- callback signature invalid (tampering or wrong secret)
  'amount_mismatch',     -- captured amount != order total
  'webhook_timeout',     -- no terminal webhook within SLA
  'capture_failed',      -- authorized but capture call failed
  'gateway_error',       -- 5xx / unknown from provider
  'risk_blocked',        -- provider risk engine blocked
  'network_error',
  'unknown'
);
create type public.refund_status        as enum ('pending', 'processing', 'processed', 'failed');
create type public.inventory_reason     as enum ('initial', 'restock', 'adjustment', 'reservation', 'release',
                                                 'sale', 'cancellation', 'return', 'damage', 'correction');
create type public.reservation_status   as enum ('active', 'released', 'consumed', 'expired');
create type public.cart_status          as enum ('active', 'converted', 'merged', 'abandoned');
create type public.checkout_status      as enum ('open', 'payment_pending', 'completed', 'expired', 'abandoned');
create type public.coupon_type          as enum ('percent', 'fixed', 'free_shipping');
create type public.offer_type           as enum ('bundle_fixed_price', 'bogo', 'tiered_percent');
create type public.redemption_status    as enum ('reserved', 'applied', 'reversed');
create type public.target_mode          as enum ('include', 'exclude');
create type public.content_status       as enum ('draft', 'published', 'archived');
create type public.blog_status          as enum ('draft', 'scheduled', 'published', 'archived');
create type public.ticket_status        as enum ('open', 'pending_customer', 'pending_internal', 'resolved', 'closed');
create type public.ticket_priority      as enum ('low', 'normal', 'high', 'urgent');
create type public.notification_status  as enum ('queued', 'sent', 'delivered', 'bounced', 'failed', 'complained');
create type public.return_reason        as enum ('size_too_small', 'size_too_large', 'defective', 'wrong_item',
                                                 'not_as_described', 'changed_mind', 'other');
create type public.tryon_error_class    as enum ('input_invalid', 'unsupported_type', 'input_too_large', 'no_person_detected',
                                                 'moderation_blocked', 'provider_error', 'provider_timeout',
                                                 'quota_exceeded', 'internal');
-- Commerce + AI events, docs/specs/05 section 3. Add new ones with ALTER TYPE ... ADD VALUE.
create type public.analytics_event_name as enum (
  'page_view', 'search_submitted', 'product_viewed', 'size_finder_opened', 'size_recommendation_generated',
  'try_on_opened', 'try_on_started', 'try_on_completed', 'try_on_failed', 'add_to_cart', 'wishlist_added',
  'checkout_started', 'payment_initiated', 'payment_succeeded', 'payment_failed', 'order_created',
  'shipment_created', 'order_delivered', 'return_requested', 'review_submitted', 'coupon_applied', 'campaign_viewed'
);

-- ---------- Shared trigger: updated_at ----------
-- Attached to every table with an updated_at column in 0014.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- "Trusted caller": service_role key, or a direct DB session with no SET ROLE (migrations,
-- seed, SQL editor, pg_cron). Uses the 'role' GUC rather than current_user so it gives the
-- same answer inside SECURITY DEFINER functions (where current_user is the owner).
create or replace function public.is_service_role()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or coalesce(nullif(current_setting('role', true), 'none'), session_user::text)
         in ('service_role', 'postgres', 'supabase_admin');
$$;
