# wavy Design System

This document describes what is **implemented** in `src/app/globals.css`, `src/app/layout.tsx` and
`src/components/ui/*`. Where it differs from `docs/specs/03_wavy_UI_UX_Design_System.md`, the
code wins. The main differences are the fonts (§2) and the 10 px overline.

**The one rule:** components never contain hex, rgb or raw px sizes. Every value is a token in `:root`,
exposed to Tailwind v4 through `@theme inline`. Change the token and the whole site follows.

## 1. Colour

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--ink` | `#111111` | `text-ink`, `bg-ink` | Text, headings, icons, primary button |
| `--ink-soft` | `#494540` | `text-ink-soft` | Secondary text, metadata (`.t-meta`) |
| `--ink-muted` | `#8A847D` | `text-ink-muted` | Placeholders, disabled, tertiary. **Not for body text** (contrast 3.55:1 on canvas, below AA for small text). |
| `--canvas` | `#FCFAF7` | `bg-canvas` | Page background (also `themeColor`) |
| `--surface` | `#FFFFFF` | `bg-surface` | Cards, fields, panels, drawers |
| `--surface-warm` | `#F7F0E9` | `bg-surface-warm` | Soft sections, notes, ghost hover, neutral badge |
| `--line` | `#E6DDD5` | `border-line` | Primary 1 px dividers, input borders |
| `--line-soft` | `#F0E9E3` | `border-line-soft`, `bg-line-soft` | Secondary dividers, skeletons |
| `--accent` | `#FFA273` | `bg-accent` | Accent CTA fill (with **ink** text), selection, highlights |
| `--accent-hover` | `#F47A4A` | `bg-accent-hover` | Accent hover |
| `--accent-deep` | `#C9532E` | `text-accent-deep` | Strong accent: link hover, sale price. 4.23:1 on canvas passes AA only for large or bold text (≥ 18.7 px bold / 24 px) and hover states. Sale prices below that size use ink, with a "Sale" badge and a struck-through compare-at price. |
| `--success` / `--warning` / `--danger` / `--info` | `#258653` / `#B7791F` / `#C43D3D` / `#4669A8` | `text-success`, `bg-success/10`… | Status only, always with text (`StatusBadge`) |
| `--rating` | `#F2A93B` | `text-rating` | Stars (paired with the numeric rating) |
| `--black` / `--on-dark` | `#080808` / `#FCFAF7` | `bg-black text-on-dark` | Admin rail, dark primary hover, footer |

Rules:
- **No peach text on white or canvas.** `#FFA273` on `#FCFAF7` is 1.9:1. Peach is a fill; the text on it is ink (9.6:1).
- Light theme only (PRD out-of-scope: dark theme). The admin rail is the one dark surface.
- Tints use Tailwind opacity modifiers on tokens (`bg-danger/10`). Shadows use `color-mix` on `--ink`.

## 2. Typography

### Fonts: Instrument Serif + Instrument Sans (replacing Inter)

The spec named Inter. The implementation uses the **Instrument** superfamily, loaded with `next/font/google`
in `layout.tsx` (`display: swap`, self-hosted by Next so there is no third-party request, and `size-adjust`
fallback metrics are generated automatically, so CLS is about 0).

| Role | Font | CSS var | Tailwind | Where |
|---|---|---|---|---|
| Editorial display | **Instrument Serif** 400, normal + italic | `--font-editorial` | `font-serif` | `.t-hero`, `.t-display`, pull quotes, journal titles, campaign headlines |
| UI and body | **Instrument Sans** variable (400–700) | `--font-ui` | `font-sans` (body default) | everything else: nav, product names, prices, forms, admin |

Why this pairing fits premium editorial fashion better than Inter alone:
- **Editorial contrast.** The reference sites get their voice from a display face set large against a quiet grotesk. Readymag's examples use typographic rhythm and scale, Peregrine uses heritage serif moments, and Dryrobe uses bold campaign headlines. Instrument Serif is a condensed, high-contrast display serif that reads as "magazine cover" at 56–88 px without looking like a luxury cliché (Didot).
- **One family, two voices.** Instrument Sans shares proportions and x-height with the serif, so mixed lines ("New *season* drop") sit on the same baseline without optical tweaks. Inter paired with any serif needs manual size and tracking compensation.
- **Less generic.** Inter is the default of SaaS dashboards. The design brief explicitly rejects "generic SaaS styling". Instrument Sans has slightly squarer terminals and tighter default spacing, which gives product grids a fashion-retail feel close to 2nd Street's and Refashion's clean sans UIs, while staying highly legible at 12–14 px for the admin.
- **Performance.** There is one variable sans file plus one serif weight, about 60 KB woff2 total for Latin. That is no heavier than Inter plus a serif.

### Fluid scale

Values are clamped between the 390 px and 1440 px viewports.

| Token | Size (390 → 1440) | Class | Font / weight / leading / tracking |
|---|---|---|---|
| `--text-hero` | 44 → 88 px | `.t-hero` / `text-hero` | Serif 400, 1.05, −0.02em |
| `--text-display` | 36 → 56 px | `.t-display` | Serif 400, 1.05, −0.02em |
| `--text-h1` | 30 → 40 px | `.t-h1` | Sans 600, 1.25, −0.02em |
| `--text-h2` | 24 → 28 px | `.t-h2` | Sans 600, 1.25, −0.02em |
| `--text-h3` | 20 px | `.t-h3` | Sans 500, 1.25 |
| `--text-body-lg` | 16 px | `text-body-lg` | Sans 400, 1.55 (inputs on mobile use this to avoid iOS zoom) |
| `--text-body` | 14 px | `.t-body` / body default | Sans 400, 1.55 |
| `--text-meta` | 12 px | `.t-meta` | Sans, `ink-soft` |
| `--text-micro` | 11 px | `text-micro` | Badges, dense table labels |
| `--text-overline` | 10 px | `.t-overline` | Sans 600, uppercase, +0.14em. The spec's 9 px was bumped for legibility. |

Use the semantic classes (`.t-h1`) for headings. Use the raw size utilities (`text-meta`) only
for component-internal text.

### How to change typography globally

| Goal | Edit |
|---|---|
| Swap the UI font | `src/app/layout.tsx`: replace `Instrument_Sans` with another `next/font/google` import, keeping `variable: "--font-instrument-sans"` (or rename it and update `--font-ui` in `globals.css`) |
| Swap the display font | same, for `Instrument_Serif` / `--font-editorial` |
| Make every H1 bigger or serif | edit `.t-h1` in `globals.css` (`font-family: var(--font-editorial)`, or change `--text-h1`) |
| Tighten or loosen the whole scale | edit the `clamp()` values in `:root`. Each one is `min, fluid, max`. |
| Change body size | `--text-body` plus the `body { font-size }` rule |

Nothing else needs to change: components reference only tokens and semantic classes.

## 3. Spacing, layout, shape

| Token | Value | Notes |
|---|---|---|
| `--space-1…24` | 4, 8, 12, 16, 24, 32, 48, 64, 96 px | 8 px rhythm. Tailwind's default spacing (`p-4` = 16 px) matches, so use Tailwind utilities. |
| `--section-y` | 48 → 96 px | `.section-y` vertical rhythm between page sections |
| `--gutter` | 16 → 48 px | `.container-x` side padding |
| `--container` | 1440 px | `.container-x` max width |
| `--header-h` | 64 px | sticky header height; use for `scroll-margin-top` |
| Grid | 12 columns desktop, 4 columns mobile | Product grid: 4 columns ≥ 1280, 3 columns ≥ 1024, 2 columns below. Gap 16 px mobile, 24 px desktop. |
| Imagery | 4:5 product, 16:9 or 21:9 campaign | `next/image` with `sizes`; `priority` only for the LCP hero |
| `--radius-sm` | 8 px | inputs, small cards, skeletons |
| `--radius-md` | 12 px | cards, drawers, dropdowns |
| `--radius-lg` | 20 px | modals, feature panels |
| `--radius-pill` | 999 px | buttons, badges, chips, swatches |
| `--shadow-sm/md/lg` | ink at 6 / 14 / 25% | sparse: dropdowns (md), drawers and modals (lg). Cards use borders, not shadows. |

## 4. Motion

Tokens: `--ease-out: cubic-bezier(0.22,1,0.36,1)`, `--dur-fast: 150ms`, `--dur-base: 280ms`, `--dur-slow: 600ms`.

| Library | Use | Rules |
|---|---|---|
| **Lenis** (`components/providers/SmoothScroll.tsx`) | global smooth page scroll, `lerp 0.12`, `autoRaf` | Off under `prefers-reduced-motion` and in `/admin`. Drawers and modals must set `data-lenis-prevent` on their scroll container. Anchor links use `lenis.scrollTo(el, {offset: -64})`. |
| **Framer Motion** | component enter/exit, drawers, image reveals, hover lifts | Leaf `"use client"` components only. Always check `useReducedMotion()` and replace transforms with opacity-only or nothing. Animate only `transform` and `opacity`. |
| CSS transitions | hover and focus colour changes (`transition-colors duration-150`) | default for buttons, links, inputs |

Timing guidance:
- hover and press: 150 ms;
- drawer and modal: 280 ms with ease-out (exit 200 ms);
- section reveal on scroll: 600 ms, translateY 16 px, then opacity, triggered once at 20% visibility, with a stagger of 60 ms per card and at most 6 staggered items;
- hero parallax: at most 8% translate.

No motion in checkout beyond 150 ms fades. Nothing auto-plays longer than 5 s without a pause control.

The global `@media (prefers-reduced-motion: reduce)` rule in `globals.css` also reduces every CSS
animation and transition to 0.01 ms.

## 5. Components and states

| Component | File | Variants / states |
|---|---|---|
| Button | `components/ui/Button.tsx` | `primary` (ink → black hover), `secondary` (ink border → fill), `accent` (peach with ink text), `ghost`, `link`; sizes `sm` 36 / `md` 44 / `lg` 52 px; `loading` shows a spinner and sets `aria-busy` and disabled; `disabled` 40% opacity with no pointer events; `ButtonLink` renders the same styles on `next/link` |
| Input | `components/ui/Input.tsx` | label (required), hint, error (text + ⚠ + `aria-invalid` + `aria-describedby`), focus border ink, disabled warm surface |
| Badge / StatusBadge | `components/ui/Badge.tsx` | tones neutral/success/warning/danger/info/accent/dark; `StatusBadge` maps every SRS status to a tone and always shows a text label and dot |
| Skeleton / EmptyState | `components/ui/States.tsx` | skeleton pulse on `line-soft`; empty state with title, body and recovery action (`role="status"`) |
| Product card | `components/commerce/ProductCard` | default, hover (second image crossfade 280 ms), out-of-stock (label + muted image), badge (New / Sale / Latest Drop), try-on chip if `tryOnEnabled` |
| Swatch / size selector | `components/commerce/` | selected (2 px ink ring), hover, unavailable (diagonal strike + `aria-disabled` + "Sold out" in the accessible name), focus-visible ring |
| Drawer / modal | `components/ui/` | focus trap, `Esc` closes, focus returns to the trigger, `aria-modal`, scroll lock + `data-lenis-prevent` |
| Toast | `sonner` `<Toaster position="bottom-center">` | success / error; errors include the request ref |

Every async surface has loading, success and error states. Every list has loading, empty and
filtered-empty states (SRS §7).

## 6. Accessibility

- Target WCAG 2.2 AA. Ink on canvas is 18.1:1; ink-soft on canvas is 9.1:1.
- `:focus-visible` shows a 2 px ink outline with a 2 px offset globally. Do not remove it; restyle it only through tokens.
- Touch targets are at least 44 × 44 px (Button `md`). Swatches are 32 px visible with a 44 px hit area.
- Status is never shown by colour alone: badges carry text, form errors carry text and an icon, stock carries text.
- Informative images have `alt` text (the admin requires it on upload). Decorative images use `alt=""`.
- Forms: visible labels (never placeholder-only); errors are announced (`aria-describedby`); valid input is kept on error.
- `lang="en"` on `<html>`; ₹ prices use `formatPrice()` (`Intl.NumberFormat('en-IN')`).
- Try-on: camera use is opt-in and has a non-camera alternative (upload). The disclaimer is text, not only an icon.

## 7. Visual references (from spec §7)

| Reference | What we take |
|---|---|
| Dryrobe | full-bleed hero storytelling; activity-led range navigation; confident campaign typography |
| Peregrine Clothing | heritage and material storytelling on PDP; fit and care education; lookbook treatment |
| 2nd STREET USA | discovery-led grids; "fresh drop" framing (the Latest Drop badge) |
| Refashion | circular-fashion service blocks (repair, reuse, buy-back) on home and About |
| Readymag examples | asymmetric editorial grids (Home / Editorial variant, Lookbook) and type-led rhythm |
