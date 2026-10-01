# wavy Design System

What is **implemented** in `src/app/globals.css`, `src/app/layout.tsx` and `src/components/ui/*`.
Where this differs from older specs, the code wins.

**Direction (2026-10-01):** premium warm monochrome, modelled on the reference in `REFERENCE_GENESIS.md`:
paper canvas, near-black ink, no colour accent, dark "stages" for the hero / lookbook / CTA band, tight
geometric display headings, pill controls, gentle motion. Product imagery supplies the colour.

**The one rule:** components never contain hex, rgb or raw px sizes. Every value is a token in `:root`,
exposed to Tailwind v4 through `@theme inline`. Change the token and the whole site follows.

## 1. Colour

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--ink` | `#121211` | `text-ink`, `bg-ink` | Text, headings, icons, primary button (17.5:1 on canvas) |
| `--ink-soft` | `#5B5954` | `text-ink-soft` | Secondary text, `.t-meta`, `.t-overline` (6.4:1) |
| `--ink-muted` | `#8A8780` | `text-ink-muted` | Placeholders, disabled. **Not for body text** (3.3:1) |
| `--canvas` | `#F3F1EC` | `bg-canvas` | Page background, warm paper (also `themeColor` in layout) |
| `--surface` | `#FBFAF7` | `bg-surface` | Cards, fields, panels, floating nav |
| `--surface-2` | `#E9E6DF` | `bg-surface-2` | Product image wells, table heads, icon discs |
| `--surface-warm` | `#EBE8E1` | `bg-surface-warm` | Soft bands ("how it works"), ghost hover, neutral badge |
| `--line` / `--line-soft` | `#DEDAD2` / `#E7E4DD` | `border-line`, `border-line-soft` | Hairlines, input borders; skeletons use `line-soft` |
| `--accent` / `--accent-hover` | `#DCD6CA` / `#CFC8BA` | `bg-accent` | Stone **fill** with ink text, selection |
| `--accent-soft` | `#E9E6DF` | `bg-accent-soft` | Promo panels, selected rows, active drop zone |
| `--accent-deep` | `#2B2A27` | `text-accent-deep` | "Accent" as text, links, progress fill (monochrome system) |
| `--success` / `--warning` / `--danger` / `--info` | `#2D7A4F` / `#94600F` / `#B43C3C` / `#41639A` | `text-success`, `bg-danger/10`… | Status only, always with text |
| `--rating` | = ink | `text-rating` | Stars (always beside the numeric rating) |
| `--black` / `--black-2` | `#0E0F11` / `#18191C` | `bg-black`, `bg-black-2` | Dark stages / raised surfaces on dark |
| `--on-dark` / `--on-dark-soft` | `#F6F4EF` / `#A9A6A0` | `text-on-dark`, `text-on-dark-soft` | Text on dark (soft = 7.6:1 on black) |
| `--line-dark` | on-dark at 14% | `border-line-dark` | Hairlines on dark |
| `--overlay` | ink at 40% | `bg-overlay` | Dialog backdrops, image scrims |
| `--focus-ring` | = ink | `outline-focus` | Global `:focus-visible` outline |

**`.on-dark`**: put it on a dark section and it sets the background and remaps `--ink`, `--ink-soft`,
`--canvas`, `--surface`, `--line` and `--focus-ring`, so `text-ink`, `border-line` and every Button variant
read correctly on dark without per-component dark styles.

Rules: no dark *mode*; dark sections are part of the design. Status is never colour alone.

## 2. Typography

| Role | Font | CSS var (next/font) | Token | Tailwind |
|---|---|---|---|---|
| UI and body | **Plus Jakarta Sans** | `--font-jakarta` | `--font-ui` | `font-sans` (body default) |
| Display (all headings) | **Urbanist** 600 | `--font-urbanist` | `--font-editorial` | `font-display` (`font-serif` is a legacy alias) |
| Indices / counters | **Geist Mono** | `--font-geist-mono` | `--font-mono` | `font-mono`, `.t-index` |

Why: the reference uses a tight geometric grotesk for headings; Urbanist is the closest Google font.
Jakarta keeps small UI text open and legible. Mono is only for "(01)", "02 / 04" style labels.

### Fluid scale (390 → 1440 px viewports)

| Token | Size | Class | Font / weight / leading / tracking |
|---|---|---|---|
| `--text-hero` | 44 → 80 px | `.t-hero` / `text-hero` | Display 600, 0.98, −0.035em, balanced |
| `--text-display` | 36 → 60 px | `.t-display` | Display 600, 1, −0.035em |
| `--text-h1` | 30 → 42 px | `.t-h1` | Display 600, 1.3, −0.012em |
| `--text-h2` | 22 → 26 px | `.t-h2` | Display 600, 1.3 |
| `--text-h3` | 19 px | `.t-h3` | Sans 500, 1.3 |
| `--text-body-lg` | 16 px | `text-body-lg` | inputs on mobile (no iOS zoom) |
| `--text-body` | 15 px | `.t-body` / body default | Sans 400, 1.6 |
| `--text-meta` | 13 px | `.t-meta` | `ink-soft` |
| `--text-micro` | 12 px | `text-micro`, `.t-index` | badges, dense tables, mono labels |
| `--text-overline` | 11 px | `.t-overline` | 500, uppercase, +0.14em, `ink-soft` |

To swap a font: change the `next/font/google` import in `layout.tsx`, keep the `variable` name (or
update `--font-ui` / `--font-editorial`). To restyle every H1: edit `.t-h1` once.

## 3. Spacing, shape, elevation

| Token | Value | Notes |
|---|---|---|
| `--space-1…24` | 4 … 96 px | 8 px rhythm, matches Tailwind spacing |
| `--section-y` / `--gutter` / `--container` / `--header-h` | 48→96 / 16→48 / 1440 / 64 px | `.section-y`, `.container-x` |
| `--radius-sm/md/lg/xl/pill` | 10 / 14 / 22 / 28 / 999 px | inputs / cards / modals, panels / bottom sheets, hero cards / buttons, chips (`xl` is new) |
| `--shadow-sm/md/lg` | ink at 4 / 12 / 20%, long soft blur | cards rest on borders; `md` for hover lift and floating controls; `lg` for drawers and modals |

Imagery: `next/image` with `sizes`, `priority` only for the LCP hero. Product images sit on `bg-surface-2`
so mixed-category packshots (white, transparent, lifestyle) look consistent.

## 4. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | enters, scroll reveals (`ease-out`) |
| `--ease-soft` | `cubic-bezier(.32,.72,0,1)` | default for every `transition-*`; drawers, carousels, hovers (`ease-soft`) |
| `--ease-spring` | CSS `linear()` spring, ~4% overshoot | modal scale-in only (`ease-spring`); never on edge-anchored panels |
| `--dur-fast` / `--dur-base` / `--dur-slow` | 180 / 320 / 640 ms | hover, colour / exits, dots, small state / panel enter, reveals, progress fill. Use `duration-(--dur-base)` |

Rules: animate only `transform` and `opacity`. Hover 180 ms; drawers open 640 ms and close 320 ms; reveals
640 ms, 16 px rise, 60 ms stagger, max ~6 staggered items. Checkout: fades and the progress fill only.
Autoplay always has a pause button and pauses on hover, focus and hidden tab. Every Framer Motion helper
checks `useReducedMotion()`, and the global reduced-motion rule zeroes CSS transitions.
**Lenis** (`SmoothScroll.tsx`, `lerp 0.1`) is off for reduced motion and `/admin`; overlays call
`lockScroll()` from the same file, which pauses Lenis and locks `<html>` (nest-safe).

| Need | Use |
|---|---|
| Section / card fades in on scroll | `Reveal`, or `Stagger` + `StaggerItem` for lists |
| Gentle idle float (home product showcase) | `Float` |
| Card hover lift | `lift` utility class (CSS only) |
| Slides, product rails | `Carousel` |
| Side panel, cart, filters, mobile menu | `Drawer` |
| Quick View, confirmations, size finder | `Modal` |

## 5. Components (`src/components/ui/`)

| Component | Props |
|---|---|
| `Button`, `ButtonLink`, `buttonClass()` | `variant: primary\|secondary\|accent\|ghost\|link`, `size: sm 36\|md 44\|lg 52`, `loading`, `full` |
| `Input` | `label` (required), `hint`, `error` + native input props |
| `Chip`, `QuantityStepper`, `Select`, `Accordion` (`Controls.tsx`) | see file; all native-element based |
| `Badge`, `StatusBadge` | `tone`, `dot` / `status` |
| `Skeleton`, `EmptyState` (`States.tsx`) | `className` / `title, body?, action?, icon?` |
| `Reveal` | `delay?, y? = 16, as?: div\|li, className?` |
| `Stagger`, `StaggerItem` | `gap? = 0.06 s, as?: div\|ul` / `as?: div\|li` |
| `Float` | `amplitude? = 8 px, duration? = 6 s, delay?` |
| `Carousel` | `label` (required), `perView? = {base, sm?, lg?}` (fractions peek), `gap? = var(--space-4)`, `autoplay?: ms`, `dots?`, `arrows? = true`, `bleed?` (edge-to-edge inside `.container-x`) |
| `Drawer` | `open, onClose, title, children, footer?, side?: right\|left\|bottom\|center, size?: sm\|md\|lg\|xl` (center only), `hideTitle?` |
| `Modal` (`Modal.tsx`, also from `Drawer.tsx`) | Drawer props minus `side`; use `size="lg"` for Quick View |
| `Progress` | `value 0–1, label, showValue?` |
| `Stepper` | `steps: string[], current` (0-based), `label?` |
| `ImageDropzone` | `value: DropzoneImage[]`, `onChange`, `label`, `hint?, error?, max? = 12, maxSizeMb? = 8, accept?`. `DropzoneImage = {id, url, alt, file?}`: new picks carry `file` + a blob preview URL; the caller uploads. First image is the cover. |

Drawer and Modal are a native `<dialog>` (`showModal()`): the page behind is inert, `Esc` closes, focus
returns to the trigger, the backdrop blurs, and the scroll container has `data-lenis-prevent`.
Carousel is CSS scroll-snap: touch swipes natively, mouse drags, arrow keys scroll the focused track.
Commerce pieces (`ProductCard`, `PriceTag`, `RatingStars`, cart, filters) live in `components/commerce/`
and use only these tokens. Toasts: `sonner` `<Toaster position="bottom-center">`.

Every async surface has loading, success and error states; every list has loading, empty and filtered-empty states.

## 6. Accessibility

- WCAG 2.2 AA. Focus is a 2 px `--focus-ring` outline, offset 2 px; restyle via the token only.
- Touch targets ≥ 44 × 44 px (Button `md`, all icon buttons, carousel dots have a 44 px hit area).
- Status never by colour alone; form errors carry text + ⚠; images need `alt` (ImageDropzone asks for it).
- Visible labels on every field (never placeholder-only); `lang="en"`; ₹ via `formatPrice()`.
