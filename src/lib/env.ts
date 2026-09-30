/**
 * Is Supabase configured? When false, repos return empty results (one warning is logged)
 * and the UI shows empty states. There is no const-data fallback.
 */
export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
/** Service role is needed for pricing, checkout, payments and webhooks. */
export const hasServiceRole = hasSupabase && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
