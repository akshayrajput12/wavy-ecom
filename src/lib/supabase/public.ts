import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous, cookie-less client for PUBLIC storefront reads (catalog, content, settings).
 * Safe inside unstable_cache because it never touches the request (RLS = anon).
 */
let client: SupabaseClient | undefined;
export function publicClient() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
