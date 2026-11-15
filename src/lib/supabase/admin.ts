import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/env";

/** Service-role / secret-key client. BYPASSES RLS: only for webhooks, jobs and server-verified admin actions. Never import in client code. */
let client: SupabaseClient | undefined;
export function adminClient() {
  client ??= createClient(supabaseUrl!, supabaseSecretKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
