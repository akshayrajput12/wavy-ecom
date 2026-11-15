import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

/** Per-request client bound to the user session (RLS applies). Use in Server Components, actions, route handlers. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component; proxy.ts refreshes the session instead
        }
      },
    },
  });
}
