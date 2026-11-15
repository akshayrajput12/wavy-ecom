import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

/**
 * Anonymous, cookie-less client for PUBLIC storefront reads (catalog, content, settings).
 * Safe inside unstable_cache because it never touches the request (RLS = anon / publishable).
 */
let client: SupabaseClient | undefined;
export function publicClient() {
  client ??= createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
