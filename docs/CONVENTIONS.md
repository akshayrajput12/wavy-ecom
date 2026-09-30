# wavy — Codebase Conventions (read before writing any code)

Stack: **Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 (token-driven) · Framer Motion · Lenis · Supabase (Postgres, Auth, Storage, RLS) · Zod · react-hook-form · Zustand (cart UI state only) · Razorpay / PayU · Shiprocket · Resend · PostHog/GA4 · MediaPipe (try-on)**

> Next 16 notes: `middleware.ts` is now **`src/proxy.ts`**. `params`, `searchParams`, `cookies()`, `headers()` are **async** (await them). Local docs: `node_modules/next/dist/docs/`.

## 1. Folder structure

```
src/
  app/                        ROUTES ONLY. Thin files: fetch data, render a View. No UI markup here.
    (store)/                  storefront route group (Header+Footer layout)
      page.tsx                -> <HomeView />
      products/[slug]/page.tsx
      ...
    (account)/                login, signup, account, orders, returns
    checkout/                 checkout flow (minimal chrome)
    admin/                    admin console (black rail layout), RBAC-guarded in proxy + layout
    api/**/route.ts           thin HTTP adapters -> call src/backend/<service>
  views/                      ONE FOLDER PER PAGE
    home/
      HomeView.tsx            composes the page's sections
      components/             sections used only by this page (Hero.tsx, FeaturedCollection.tsx…)
    product/ collection/ cart/ checkout/ account/ admin-dashboard/ ...
  components/                 GLOBAL components — only things used in 2+ views
    ui/                       primitives: Button, Input, Badge, States (Skeleton/EmptyState)…
    layout/                   Header, Footer, AdminShell…
    commerce/                 ProductCard, PriceTag, Swatch, SizeSelector, RatingStars…
    providers/                client providers (SmoothScroll…)
  data/                       CONST DATA — one .ts per domain (products.ts, orders.ts, categories.ts,
                              home.ts, navigation.ts, admin.ts…). Page copy lives here too, not in JSX.
  backend/                    SERVER-ONLY "microservices" — one folder per domain
    _core/                    http.ts (route wrapper, errors), auth.ts (session + RBAC guards)
    catalog/ cart/ pricing/ checkout/ payments/ orders/ shipping/ returns/ reviews/
    content/ marketing/ analytics/ settings/ notifications/ integrations/
      service.ts              business logic (pure where possible)
      repo.ts                 data access: Supabase if configured, else src/data fallback
      schema.ts               zod input schemas
      providers/              external adapters (payments/providers/razorpay.ts, payu.ts)
  lib/                        framework glue: logger.ts, supabase/{server,client,admin}.ts, format.ts, env.ts
  types/                      domain.ts (shared contract), database.ts (Supabase types)
  tryon/                      EVERYTHING for virtual try-on lives here (components, engine, api helpers)
supabase/
  migrations/                 numbered SQL migrations (schema, RLS, indexes, functions)
  seed.sql                    demo data matching src/data
docs/                         specs/, database/, system-design/, design/, tryon/, api/
```

### Rules
1. **Component placement**: build a section inside `views/<page>/components/`. The moment a component is used in a **2nd view**, move it to `components/`.
2. **No hard-coded content in JSX.** Text lists, nav items, product data, and page copy come from `src/data/<domain>.ts` (or from the backend, which falls back to that data). Components receive data via **props**.
3. **Data flow**: `app/**/page.tsx` (Server Component) → `backend/<svc>/repo.ts` → returns typed data (`types/domain.ts`) → `<XView data={…} />` → components. Client components only where interaction needs it (`"use client"` at the smallest leaf).
4. **Const fallback**: every repo checks `hasSupabase` (`lib/env.ts`); without Supabase it returns `src/data` so the UI always renders.
5. **API routes** use `route("svc", handler)` from `backend/_core/http.ts`, validate with zod via `parse()`, and return `ok()`/`ApiError`. Each service is isolated: one failing never breaks others.
6. **Server authority**: prices, totals, coupon/offer eligibility, tax and stock are computed on the server. Client-sent prices are ignored.
7. **Idempotency**: payment/order/inventory writes take an idempotency key and are safe to retry. Webhooks are deduped by provider event id.
8. **Logging**: `import { logger } from "@/lib/logger"`. Use `logger.child({ svc, orderId })`, event names in `domain.action` form (`payment.verify_failed`). Never `console.log` in app code. Never log secrets (auto-redacted by key).
9. **Money** = integer **paise**. Display with `formatPrice()`.

## 2. Styling rules
- **No hex/rgb in components.** Colours, type, spacing, radii and shadows are tokens in `src/app/globals.css` (`:root`) exposed as Tailwind utilities: `bg-canvas text-ink border-line bg-accent text-ink-soft rounded-md shadow-md text-h1`…
- Semantic type classes: `.t-hero .t-display .t-h1 .t-h2 .t-h3 .t-body .t-meta .t-overline`. To restyle every H1 on the site, edit `.t-h1` once.
- Layout helpers: `.container-x` (max width + gutter), `.section-y` (vertical rhythm).
- Fonts: **Instrument Serif** (editorial display, `font-serif`) + **Instrument Sans** (UI, `font-sans`).
- Light theme only. Do not put peach text on white. Status is always shown with text, not colour alone.
- Motion: Framer Motion for component animation (respect `useReducedMotion`), Lenis for page scroll (global, skipped in /admin).

## 3. Code quality
- TypeScript strict, no `any` (use `unknown` + zod). Named exports. PascalCase components, camelCase functions.
- Keep files focused (under about 200 lines). No speculative abstractions. Reuse `components/ui` before creating new primitives.
- Accessibility: labelled inputs, `alt` on informative images, visible focus, keyboard reachable, 44px touch targets.
- Images: `next/image` with `sizes`, lazy by default and `priority` only for the LCP hero.
- Each non-trivial money/security path has one `*.test.ts` (vitest) next to it.
