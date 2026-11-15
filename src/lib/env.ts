/**
 * Supabase API Keys (supports both new publishable/secret keys and legacy anon/service-role keys).
 * Ref: https://supabase.com/docs/guides/api/api-keys
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Is Supabase configured? When false, repos return empty results (one warning is logged)
 * and the UI shows empty states. There is no const-data fallback.
 */
export const hasSupabase = Boolean(supabaseUrl && supabasePublishableKey);

/** Service / secret role is needed for pricing, checkout, payments, webhooks and admin actions. */
export const hasServiceRole = hasSupabase && Boolean(supabaseSecretKey);
