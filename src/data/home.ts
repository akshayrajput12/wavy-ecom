/** Home (screen 01) and Editorial home (screen 02) copy + merchandising picks. */
const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1600&q=80`, alt });

export const home = {
  hero: {
    overline: "Drop 04 — Monsoon 2026",
    title: "Made for heat, rain & everything in between.",
    body: "Heavyweight cotton, washed linen and sneakers built for wet stone. Designed in Bengaluru, made in Tirupur and Chennai.",
    primary: { label: "Shop New In", href: "/new-in" },
    secondary: { label: "Explore sneakers", href: "/collections/sneakers" },
    image: img("1509631179647-0177331693ae", "Model in a loose neutral outfit against a soft backdrop"),
    caption: "Plate 01 · The Daybreak Hoodie in Heather Bone",
  },
  departments: [
    { label: "Clothing", body: "Tees, shirts, sweats & shells", href: "/collections/clothing", image: img("1490481651871-ab68de25d43d", "Clothing rail") },
    { label: "Sneakers", body: "Low-tops, high-tops & runners", href: "/collections/sneakers", image: img("1595950653106-6c9ebd614d3a", "Sneakers on a neutral background") },
  ],
  newArrivals: { overline: "Just landed", title: "New arrivals", cta: { label: "View all", href: "/new-in" } },
  featured: {
    slug: "monsoon-edit",
    overline: "Featured collection",
    cta: "Shop the edit",
    notes: ["Quick-dry ripstop", "Seam-sealed shells", "Grippy rubber outsoles"],
  },
  completeTheLook: {
    overline: "Complete the look",
    title: "One outfit, four pieces, zero thought.",
    body: "Tap a piece to see it. Everything here ships together in a single box.",
    image: img("1617137968427-85924c800a22", "Model wearing an overshirt, tee, trousers and sneakers"),
    items: [
      { productId: "p_007", x: 42, y: 30 },
      { productId: "p_004", x: 55, y: 45 },
      { productId: "p_010", x: 48, y: 70 },
      { productId: "p_015", x: 52, y: 92 },
    ],
    cta: "Add the look",
  },
  bundle: {
    overline: "Offer",
    title: "Any 3 essentials for ₹999",
    body: "Mix crew tees, pocket tees and rib tanks in any colour. The discount applies automatically in your bag.",
    cta: { label: "Build your three", href: "/collections/3-for-999" },
    image: img("1523381210434-271e8be1f52b", "Stack of folded cotton tees"),
  },
  social: {
    overline: "From the community",
    title: "Worn hard, reviewed honestly.",
    stats: [
      { value: "4.8/5", label: "Average rating" },
      { value: "10 days", label: "Doorstep returns" },
      { value: "2–5 days", label: "Delivery across India" },
    ],
  },
  journal: { overline: "Journal", title: "Notes from the studio", cta: { label: "Read the journal", href: "/journal" } },
} as const;

export const editorial = {
  issue: "Issue 04",
  season: "Monsoon / 2026",
  title: ["Soft", "armour", "for wet", "cities."],
  intro: "A study in layers that breathe: loopback cotton under ripstop, linen that forgives the humidity, and soles that bite into laterite.",
  cta: { label: "Shop the issue", href: "/collections/monsoon-edit" },
  plates: [
    { image: img("1515886657613-9f3515b0c78f", "Model in a relaxed layered look"), caption: "Plate 01 — Linen Camp Shirt, Sand" },
    { image: img("1552374196-1ab2a1c593e8", "Man in an oversized jacket in the city"), caption: "Plate 02 — Field Overshirt, Khaki" },
    { image: img("1469334031218-e382a71b716b", "Model in soft light"), caption: "Plate 03 — Essential Rib Tank" },
  ],
  manifesto: {
    overline: "Manifesto",
    quote: "We make fewer things, heavier, and we make them to be repaired.",
    body: "Every wavy garment is cut from certified organic or recycled fibre in partner mills within 400 km of our Bengaluru studio. We publish our margins, repair for free for a year, and take back what you've worn out.",
  },
  picksTitle: "Pieces in this issue",
  picks: ["p_008", "p_012", "p_013", "p_019", "p_003", "p_007"],
  chapters: [
    { n: "I", title: "Fabric first", body: "280 GSM loopwheel jersey knitted slow, so it dries fast and holds its shape through a hundred washes.", image: img("1434389677669-e08b4cac3105", "Close-up of knit fabric textures") },
    { n: "II", title: "Grip over gloss", body: "Vibram and natural-rubber outsoles, siped for wet marble and monsoon pavements.", image: img("1491553895911-0055eca6402d", "Sneaker outsole detail") },
  ],
} as const;
