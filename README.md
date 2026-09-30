# wavy — Fashion Commerce

Premium clothing & sneakers storefront + admin console.
Next.js 16 · TypeScript · Tailwind v4 tokens · Framer Motion · Lenis · Supabase · Razorpay/PayU · Shiprocket · in-house MediaPipe try-on.

## Quick start

```bash
npm install
cp .env.example .env.local      # leave Supabase blank to run on demo data (src/data/*.ts)
npm run dev                     # http://localhost:3000   admin: /admin
```

## Connect Supabase

Option A: hosted project (no Docker needed):
```bash
npx supabase login
npx supabase link --project-ref <your-ref>
npx supabase db push            # runs supabase/migrations/*
psql "$DB_URL" -f supabase/seed.sql   # or paste seed.sql in the SQL editor
```
Then fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, and enable the **Custom Access Token hook** (Auth → Hooks → `public.custom_access_token_hook`) so staff roles reach the JWT.

Option B: local (needs Docker Desktop):
```bash
npm run db:start && npm run db:reset && npm run db:types
```


## Scripts
| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run db:types` | regenerate `src/types/database.ts` |

## Where things live
Read **[docs/CONVENTIONS.md](docs/CONVENTIONS.md)** before coding. Specs: `docs/specs/`. Architecture, payments, capacity: `docs/system-design/`. Database: `docs/database/`. Design system + screen map: `docs/design/`. Try-on: `docs/tryon/`.

Try-on API contract: `docs/api/TRYON_V1.md`. The free live preview runs in the browser and does not upload camera frames. Photo generation is disabled. BHMR reference adaptation: `docs/design/REFERENCE_BHMR.md`.
