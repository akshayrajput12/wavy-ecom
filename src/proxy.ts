import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabase } from "@/lib/env";

/**
 * 1. Refreshes the Supabase session cookie on every page/API request (Server Components cannot write cookies).
 * 2. Fast RBAC gate from the JWT `user_role` claim (custom_access_token_hook):
 *    /admin/** staff only, /account/** any signed-in user, /api/admin/** 401/403 JSON.
 * The claim can lag a role change by up to an hour; every admin getter/route re-checks the profile in the DB.
 */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  if (!hasSupabase) return res;   // demo mode: admin getters return empty, writes answer 503

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const path = req.nextUrl.pathname;
  let role = typeof claims?.user_role === "string" ? claims.user_role : undefined;
  // No claim (access-token hook not enabled): ask the DB, but only on staff-gated paths.
  if (!role && claims?.sub && (path.startsWith("/admin") || path.startsWith("/api/admin"))) {
    role = ((await supabase.rpc("auth_role")).data as string | null) ?? undefined;
  }
  const staff = !!claims?.sub && !!role && role !== "customer";

  if (path.startsWith("/api/admin")) {
    if (!claims?.sub) return deny(res, 401, "unauthenticated", "Please sign in");
    if (!staff) return deny(res, 403, "forbidden", "Staff access only");
    return res;
  }
  const needsStaff = path === "/admin" || path.startsWith("/admin/");
  const needsUser = path === "/account" || path.startsWith("/account/");
  if ((needsStaff && !staff) || (needsUser && !claims?.sub)) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", path + req.nextUrl.search);
    return withCookies(res, NextResponse.redirect(login));
  }
  return res;
}

/** Keep any refreshed session cookies on the short-circuit response. */
function withCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c));
  return to;
}
function deny(res: NextResponse, status: number, code: string, message: string) {
  return withCookies(res, NextResponse.json({ ok: false, error: { code, message } }, { status }));
}

// Public, CDN-cacheable JSON (PUBLIC_CACHE / STATIC_CACHE, and the sessionless /api/geo lookups) skips the session refresh: no auth round trip, and a
// refreshed Set-Cookie can never end up on a shared cached response.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/products|api/search/suggest|api/shipping/methods|api/geo|maplibre/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|webmanifest)$).*)"],
};
