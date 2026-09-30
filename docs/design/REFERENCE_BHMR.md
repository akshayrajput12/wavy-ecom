# BHMR motion reference notes

Reviewed `Downloads/BHMR/src/components/home/sections` on 2026-09-26. The motion ideas adapted for wavy are the restrained parts that fit an editorial apparel storefront.

## Patterns in the reference

- `HeroSection` uses a prominent first screen and scroll-led transition into the page.
- `SolutionSection` pins a designed area while content enters in a short scrubbed timeline.
- `IndustriesSection` holds a sticky full-screen stage over a long scroll range; image cards enter, cross the viewport and leave in sequence. It clips overflow because its media is deliberately positioned outside the viewport.
- The reference has pointer parallax and large decorative movements. Those are intentionally not copied into wavy's product browsing flow.

## wavy adaptation

- The home hero has a short `116svh` scroll range with a sticky viewport. Its photo scales slightly and the copy lifts/fades as the shopper leaves the hero. Reduced-motion users get no scroll movement.
- Existing `ProductRail` is a native, touch-friendly horizontal scroller with proximity snap and contained overscroll. It does not hijack vertical scrolling.
- Product and department cards retain their existing reveal and hover treatment. The wavy palette, typography and accessible browser scroll behavior remain the design source of truth.

## Maintenance notes

Keep pinned sequences short and limited to a single story beat. Every scroll-linked element must have a reduced-motion path. Prefer native horizontal scroll for product collections; do not pin a long page section to force a gallery interaction.
