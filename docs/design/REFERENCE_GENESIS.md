# Visual reference: "Genesis Clothing" storefront (2026-10-01)

The owner supplied nine screenshots of a premium teamwear storefront as the visual target for wavy.
We copy its **layout, rhythm, type and motion language**, not its brand, copy or products (all content still comes
from Supabase; microcopy from `src/data/`). Tokens implementing this live in `src/app/globals.css`.

## Overall feel
Warm monochrome. Paper canvas (`bg-canvas`), near-black ink, generous whitespace, **dark "stages"** for the hero,
the lookbook gallery and the closing CTA band (`.on-dark` helper flips ink/canvas/line tokens inside a section, so
`text-ink`, `border-line`, Button variants all just work on dark). No colour accent: emphasis comes from scale,
weight and black/white pills. Product imagery provides the colour.

## Type
- Headings: **Bricolage Grotesque 650–700**, condensed (`--stretch-display`), tight tracking (`--tracking-display`), line-height ~0.95, 2-line balanced headings
  ("Built for / every squad"). Classes `.t-hero .t-display .t-h1 .t-h2` already use it.
- Body/UI: Plus Jakarta Sans, small (13–15 px), `text-ink-soft` for descriptions.
- Overline above every section heading: tiny uppercase tracked grey (`.t-overline`), e.g. "BEST SELLERS".
- Indices and counters in mono (`.t-index`): "(01)", "02 —— 04", "01 / 11".
- Secondary heading line can be greyed: "Trusted by teams" (ink) / "on and off the pitch" (ink-soft).

## Header / nav
- **Floating pill bar**, inset from the viewport edges and the top (about 12 px), `rounded-pill`, `bg-surface/80`
  + backdrop blur + hairline border + `shadow-sm`; max width aligned with `.container-x`.
- Left: logo mark + store name. Centre: nav links as tiny uppercase tracked labels (PRODUCTS · CUSTOM · OUR WORK ·
  ABOUT) sitting inside their own inner pill group. Right: an outlined pill CTA (tiny uppercase) + a 36–40 px circular
  bag icon button (with count badge).
- Over a dark hero the bar turns dark-glass (`bg-black/40`, light text, `border-line-dark`); over paper it is light.
  It stays floating (sticky) on scroll; can hide on scroll-down / show on scroll-up.
- Mobile: logo + name left; two circular icon buttons right (bag, menu "=") ; menu opens a full-height sheet.

## Hero (dark stage, carousel)
- Full-bleed, ~100svh, rounded bottom corners optional. Background = deep radial gradient tinted per slide (maroon,
  black-gold…) with a soft vignette; product cut-out centred, floating, with a soft ground shadow.
- Left column: two small circular prev/next buttons + counter "02 —— 04" (mono), a 2-line hero headline
  ("Wear your heritage"), a 2–3 line description, CTAs: white pill "Get the look ›" + outlined pill.
- Bottom-right: thumbnail of the **next** slide's product (click = next). Bottom-centre: small caption line.
  Bottom-left: social icon circles. Mobile: headline top, product centre, "FROM ₹360" price + size pills + full-width
  white pill CTA at the bottom.
- Motion: slide change = product cross-fades + slides/scales slightly, background colour tweens, headline lines rise.

## Section heading pattern (all home sections)
Overline → big 2-line heading on the left; "View all products ›" small underlined link aligned bottom-right.

## Product rail — "Team favourites"
- Cards: tall image well (`bg-surface-2`, rounded-lg) with the product on it, tiny category chip top-left inside the
  well. Below: name (13–14 px, medium), stars + "4.9/5", "From ₹340"; a **black circular cart/quick-add button**
  on the right of the meta row.
- Horizontal rail, cards ~ 5 visible on desktop, peeking at both edges; prev/next small circular buttons
  bottom-right (active = black filled, inactive = outlined).
- Hover: image scales 1.04, well darkens slightly, quick-view/quick-add affordance fades up.

## Category grid — "Built for every squad"
- 3 columns desktop / 2 columns mobile, tall cards (~4:5), full-bleed photo, rounded-lg, dark gradient at the
  bottom. Top-left "(01)" mono index; top-right circular arrow "↗" button; bottom-left category name (h3, white)
  + a one-line description.
- Hover: image zooms slowly (scale 1.06, ~700 ms ease-out), gradient deepens, arrow button fills white and rotates
  45°, description slides up. Cards reveal staggered on scroll.

## Feature split — "Your crest. Your colours. Your names."
Large dark product photo with a small overlapping detail photo (fabric close-up) at its bottom-right; right column:
overline, 3-line heading, short paragraph, a list of 4 features separated by hairlines (icon + title + one line),
then an underlined text link.

## Steps band — "From brief to match day"
`bg-surface-warm` rounded band; heading left + link right; 4 columns each with a top hairline, "01" mono, title,
2-line description.

## Lookbook — "Kits in the wild" (dark stage)
Full-bleed dark section; header row: overline + big heading left, "PROJECTS (11)" right. A row of tall edge-to-edge
image panels (no gaps or 2 px gaps), draggable horizontally, custom "‹ DRAG TO SLIDE ›" cursor pill on hover, most
panels desaturated with the active one in colour. Caption bar beneath: title + uppercase meta, counter "01 / 11"
+ prev/next circles.

## Testimonials — "Trusted by teams / on and off the pitch"
A mosaic/collage of ~14 small rounded portrait images arranged in an arc around a centred chip "Testimonials" and a
2-line heading; below, 3 columns of quotes: avatar initials circle + name + role, stars, quote text.

## FAQ — "Questions, answered."
Two columns: left overline + heading + one-line description + "All questions ›" link; right an accordion with hairline
separators, question rows with a circular +/− toggle (filled black when open).

## CTA band — "Ready to kit out your team."
Dark rounded card inset in the page, centred huge heading, one line of copy, white pill + outlined pill CTAs, a row
of product images fanned along the bottom edge with a subtle coloured glow behind.

## Footer
Paper background. Left: logo + 3-line blurb + social icon circles. Right: 3 link columns with tiny uppercase grey
headings (SHOP, HELP, COMPANY). Hairline, then © line left and contact line right. Finally a **giant full-width
wordmark** of the store name (`.t-wordmark`: Bricolage 700, condensed, tight tracking) sized to the container; it reveals letter by letter as the footer scrolls in.

## Motion rules
Framer Motion; respect `useReducedMotion` (no transforms, keep fades or nothing). Entrances: 16–24 px rise + fade,
`--ease-out`, stagger 60–80 ms. Hovers: `--ease-soft`, 300–700 ms. No scroll-jacking; horizontal rails use native
scroll + snap (see `REFERENCE_BHMR.md`). Lenis stays global on the storefront.
