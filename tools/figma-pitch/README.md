# wavy — Figma pitch board

A Figma plugin that builds a native pitch board for wavy on a page called **"wavy — Pitch"**. There are no screenshots:
every screen is made of real, editable layers (auto-layout frames, text, vectors, components and instances), rebuilt from
an analysis of this codebase.

## Use it

1. In Figma desktop, go to **Plugins → Development → Import plugin from manifest…** and pick
   `tools/figma-pitch/plugin/manifest.json`.
2. Open any design file and run **Plugins → Development → wavy — Pitch board**. Progress shows as a Figma notification;
   a full build takes a few minutes. Re-running clears and rebuilds the page and updates the `wavy/…` styles by name.
3. After code changes, refresh the data that the plugin carries:

   ```bash
   cd tools/figma-pitch && npm i && node generate.mjs
   ```

There is no capture step and no dev server, and no folder to pick. `plugin/code.js` already contains the generated
spec, so step 3 is only needed when the code changes.

## What it builds

- **Cover:** the stack (from `package.json`), real repo counts (routes, admin routes, services, API routes,
  migrations, components and views) and the contents.
- **01 Design system:** the colour, text and effect styles from `src/app/globals.css` (with the `.on-dark` remap);
  lucide icons as components; and components with variant and text properties: Button (plus Button on dark), Badge,
  Input, Select, Toggle, Checkbox, Radio, Chip, Size, Quantity, Rating, ProductCard, SectionHead, Header (desktop and
  mobile, light and dark), Footer, Admin sidebar and KPI tile.
- **02 Storefront:** 14 screens at 1440 and 390:
  - the home page, built from the `home_sections` in seed order
  - collections and the PLP, with and without its filter drawer
  - the PDP, search, wishlist, and the bag page and drawer
  - the blog and an article, the FAQ, a content page and the 404
- **03 Checkout & Account:** 17 screens at 1440 and 390:
  - the 3-step checkout: contact, delivery address with the map panel, delivery speed, and payment with the summary
  - order confirmed, with the GST invoice
  - log in, sign up and forgot password
  - the account dashboard, orders and order detail, addresses, profile, returns, the return request and return
    received pages, and order tracking
- **04 Admin:** all 61 `/admin/**` routes at 1440 inside the real shell (sidebar groups from `views/admin/rbac.ts`),
  plus mobile versions of the dashboard, the products list, the product editor and orders, and the navigation drawer.

## How it is derived

`generate.mjs` statically analyses the repo, then writes the spec between the `@generated-spec` markers in `plugin/code.js`.

| Source | What is read |
| --- | --- |
| `src/app/globals.css`, `layout.tsx` | Tokens: colours, fonts, the type scale and `.t-*` classes, weights, radii, spacing, shadows and `.on-dark` (`tokens.mjs`). |
| `supabase/seed.sql` | Store settings, categories, collections and membership, products (prices in paise → ₹, colours, sizes, stock), home sections, FAQs, testimonials, blog, pages, coupons, shipping, gateways, integrations and SEO (`seed.mjs`). |
| `src/data/copy.ts`, `storefront.ts`, view `copy.ts` files | Every label, heading, button and empty state. These files are evaluated, so copy functions give their real output. |
| `src/app/admin/**/page.tsx` → `src/views/admin/**` | Per route: the page title, `PageHeader` title, description and actions, panel and form-section titles, field labels, hints and controls, table columns, filters and bulk actions. It follows the view's own component imports (`admin.mjs`). |
| `node_modules/lucide-react` | The icon vector paths. |

### Approximations

- **Layouts are reconstructions, not pixel copies.** Storefront, checkout and account pages are hand-built from the
  views. Admin screens use archetypes (list, editor, settings, dashboard, analytics, detail and the home-sections editor),
  filled with each route's real information architecture.
- **Images:** `seed.sql` ships no images, so the product wells show the product's initial on its first seed colour.
  Category, collection and hero art use the outlined-initial placeholder that the site itself renders without images.
- **Data that is not in the seed:**
  - There are no orders, customers, reviews, returns, staff, offers, campaigns or audit entries in the seed. Those admin
    rows, the dashboard KPI values and the charts are illustrative, built from seed products and testimonial names, and
    every such screen carries an "Illustrative rows (not in seed)" chip.
  - A sample shopper stands in for the signed-in checkout and account screens.
- **Fonts:** Bricolage Grotesque, Plus Jakarta Sans, Instrument Serif and Geist Mono are used when the Figma install
  has them. Otherwise Inter stands in. Weights snap to the nearest installed style (360 → Regular) and widths
  (`font-stretch`) snap to the nearest named cut. Every substitution is noted on the cover and in the design system.

## Files

```
tools/figma-pitch/
  plugin/manifest.json   import this in Figma (no UI, no network, dynamic-page)
  plugin/code.js         the plugin: hand-written builders + the generated SPEC (plain JS, no build step)
  generate.mjs           repo analysis -> SPEC in plugin/code.js
  tokens.mjs  seed.mjs  admin.mjs   its parsers (tokens.mjs and seed.mjs self-check when run directly; generate.mjs
                                    fails loudly if the admin IA, seed content or icons stop being found)
```

## Checks

```bash
npm run check   # tokens + seed self-checks, node --check plugin/code.js, type-check against @figma/plugin-typings
```
