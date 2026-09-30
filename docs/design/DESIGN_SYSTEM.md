# wavy Design System

What is **implemented** in `src/app/globals.css`, `src/app/layout.tsx` and `src/components/ui/*`.
Where this differs from older specs, the code wins.

**Direction:** a multi-category store (electronics, home, beauty, fashion, grocery, books), so the look is
calm, soft and neutral: warm off-white canvas, soft ink, one sage accent, diffuse shadows, gentle motion.
Nothing loud, nothing dramatic.

**The one rule:** components never contain hex, rgb or raw px sizes. Every value is a token in `:root`,
exposed to Tailwind v4 through `@theme inline`. Change the token and the whole site follows.

## 1. Colour

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--ink` | `#1D1C1A` | `text-ink`, `bg-ink` | Text, headings, icons, primary button (16.2:1 on canvas) |
| `--ink-soft` | `#57534D` | `text-ink-soft` | Secondary text, `.t-meta` (7.3:1) |
| `--ink-muted` | `#85807A` | `text-ink-muted` | Placeholders, disabled. **Not for body text** (3.7:1) |
| `--canvas` | `#FAF9F6` | `bg-canvas` | Page background (also `themeColor` in layout) |
| `--surface` | `#FFFFFF` | `bg-surface` | Cards, fields, panels |
| `--surface-2` | `#F4F3EF` | `bg-surface-2` | **new.** Neutral inset fill: image wells, table heads, icon discs |
| `--surface-warm` | `#F6F2EC` | `bg-surface-warm` | Soft sections, ghost hover, neutral badge |
| `--line` / `--line-soft` | `#E6E3DD` / `#EFEDE8` | `border-line`, `border-line-soft` | Dividers, input borders; skeletons use `line-soft` |
| `--accent` | `#BCD4C5` | `bg-accent` | Soft sage **fill** with ink text (10.8:1), selection |
| `--accent-hover` | `#A7C6B3` | `bg-accent-hover` | Accent hover |
| `--accent-soft` | `#E7EFE9` | `bg-accent-soft` | **new.** Accent tint: promo panels, selected rows, active drop zone |
| `--accent-deep` | `#3D6853` | `text-accent-deep` | Accent as text, links, progress fill, focus ring (6.0:1, AA body) |
| `--success` / `--warning` / `--danger` / `--info` | `#2D7A4F` / `#94600F` / `#B43C3C` / `#41639A` | `text-success`, `bg-danger/10`… | Status only, always with text. All ≥ 5:1 on canvas |
| `--rating` | `#E0A13A` | `text-rating` | Stars (always beside the numeric rating) |
| `--black` / `--on-dark` | `#151413` / `#FAF9F6` | `bg-black text-on-dark` | Admin rail, footer, dark hover |
| `--overlay` | ink at 32% | `bg-overlay`, `backdrop:bg-overlay` | **new.** Dialog backdrops, image scrims |
| `--focus-ring` | = `--accent-deep` | `outline-focus`, `ring-focus` | **new.** Global `:focus-visible` outline |

Rules: light theme only. Accent is a fill, never text on white (use `accent-deep` for text). Tints use
opacity modifiers on tokens (`bg-danger/10`). Status is never colour alone.

## 2. Typography

| Role | Font | CSS var (next/font) | Token | Tailwind |
|---|---|---|---|---|
| UI and body | **Plus Jakarta Sans** (variable 200–800) | `--font-jakarta` | `--font-ui` | `font-sans` (body default) |
| Display, sparingly | **Newsreader** (variable, `opsz` axis, normal + italic) | `--font-newsreader` | `--font-editorial` | `font-serif` |

Why: Jakarta Sans has open, rounded-geometric forms, so it reads friendly and clearly non-system at 12–15 px
without being quirky. Newsreader is a low-contrast book serif with optical sizing: soft and calm at display
sizes, never "fashion magazine". Use the serif for `.t-hero`, `.t-display`, the logo and big numerals only.

### Fluid scale (390 → 1440 px viewports)

| Token | Size | Class | Font / weight / leading / tracking |
|---|---|---|---|
| `--text-hero` | 40 → 64 px | `.t-hero` / `text-hero` | Serif 400, 1.12, −0.012em, balanced |
| `--text-display` | 32 → 48 px | `.t-display` | Serif 400, 1.12, −0.012em |
| `--text-h1` | 28 → 36 px | `.t-h1` | Sans 600, 1.3, −0.012em |
| `--text-h2` | 22 → 26 px | `.t-h2` | Sans 600, 1.3 |
| `--text-h3` | 19 px | `.t-h3` | Sans 500, 1.3 |
| `--text-body-lg` | 16 px | `text-body-lg` | inputs on mobile (no iOS zoom) |
| `--text-body` | 15 px | `.t-body` / body default | Sans 400, 1.6 |
| `--text-meta` | 13 px | `.t-meta` | `ink-soft` |
| `--text-micro` | 12 px | `text-micro` | badges, dense tables |
| `--text-overline` | 11 px | `.t-overline` | 600, uppercase, +0.12em |

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
