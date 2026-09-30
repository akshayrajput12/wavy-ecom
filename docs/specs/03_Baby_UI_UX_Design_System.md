
UI / UX DESIGN SYSTEM & VISUAL REQUIREMENTS
wavy Canonical visual language, tokens, components and reference synthesis
wavy Fashion Commerce System | Requirements Pack v1.0 | 25 Sep 2026
Scope: Defines what must be built: product capabilities, user-visible behavior, data, integrations, visual requirements, screen inventory and acceptance conditions. It does not define implementation approach, framework choice or project schedule.
1. Visual direction
Premium editorial fashion commerce. Light theme only. Product imagery is the primary visual asset. Use warm off-white canvas, black/ink typography, warm peach accent, quiet borders, restrained radii, compact utilities and deliberate asymmetry. Admin content remains light; a black navigation rail is permitted.
2. Canonical palette
Token
Usage
Hex
Ink
Primary text / headings / icons
#111111
Ink Soft
Secondary text / metadata
#494540
Canvas
Page background
#FCFAF7
Surface
Cards / fields / panels
#FFFFFF
Surface Warm
Soft sections / notes
#F7F0E9
Border
Primary divider
#E6DDD5
Border Soft
Secondary divider
#F0E9E3
Accent
Primary highlight / CTA fill
#FFA273
Accent Hover
Hover state
#F47A4A
Accent Deep
Strong accent/link
#C9532E
Success
Success
#258653
Warning
Warning
#B7791F
Danger
Error/destructive
#C43D3D
Info
Information
#4669A8
Rating
Rating indicator
#F2A93B
Black
Deep nav/strong contrast
#080808
3. Typography
Token
Value
Use
Font family
Inter
Canonical UI font across storefront, mobile, admin and Figma plugin.
Type 56
56 / Bold
Hero display.
Type 40
40 / Bold
Hero/major editorial heading.
Type 28
28 / Bold
Page/section title.
Type 20
20 / Medium
Secondary heading/card group.
Type 14
14 / Medium
Body/controls/labels.
Type 12
12 / Regular
Metadata/helper/table text.
Type 11
11 / Regular
Dense utility labels.
Type 9
9 / Regular
Micro labels/overlines.
Editorial display
Optional restrained serif
Editorial display moments only.
4. Layout tokens
Desktop reference artboard: 1440×1024; Figma working desktop frames may use 1280 px.
Mobile reference artboard: 390×844.
Desktop grid: 12 columns with generous outer margins.
Spacing rhythm: 8 px increments, commonly 8/16/24/32/48.
Radii: 8–20 px depending on component; borders generally 1 px; shadows soft and sparse.
No full dark-theme screens; no neon, excessive glassmorphism or generic SaaS styling.
5. Components
Component
Required behavior
Global header
Brand + primary nav + search + wishlist + account + bag; consistent between related screens.
Buttons
Dark primary, bordered secondary, accent CTA, text action, disabled/loading.
Product card
Image, badge, name, descriptor, price, rating, swatches, availability, optional Try It On.
Variant swatch
Selected, hover, disabled and accessible label.
Size selector
Selected/unavailable states + size guide.
Filter bar
Chips/dropdowns, active state, count, clear-all, sort.
Input
Label, placeholder, helper, error, disabled, focus.
Modal/drawer
Size finder, cart drawer, overlays, confirmations.
Data table
Search/filter, pagination, state, row/bulk actions for admin.
Status badge
Success/warning/danger/info/neutral; never color-only.
Tabs / stepper
Product detail and checkout/navigation contexts.
Empty/loading
Contextual empty state plus recovery; skeletons for asynchronous lists.
6. Accessibility
Do not use peach body text on white; use dark ink for readable text.
Controls have visible focus states and keyboard access.
Form errors and system status use text/icon plus color.
Informative images have alt text; decorative images can be marked decorative.
Mobile touch targets must be comfortably tappable.
7. Reference sources
Dryrobe — https://dryrobe.com/  Hero storytelling, product merchandising, range architecture, activity-led discovery, guides, impact stories, search/cart.
Peregrine Clothing — https://www.peregrineclothing.co.uk/  Heritage storytelling, material/size/color filtering, variant handling, fit/care education, lookbook treatment.
2nd STREET USA — https://2ndstreetusa.com/  Discovery-led fashion retail, lookbooks/news, unique-item framing, locations, fresh-inventory feel.
Refashion — https://refashion.fr/en/  Circular-fashion education/service, reuse/repair/recycle storytelling, service/locator concepts.
Readymag — https://readymag.com/examples/  Editorial composition, custom grids, typography-led visual rhythm, motion-ready composition.
