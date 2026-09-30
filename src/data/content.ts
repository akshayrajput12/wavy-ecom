/** Page copy + config for collection, search, product, cart, wishlist and content pages. */
const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1600&q=80`, alt });

// ---------- Commerce rules (display estimates only; the server is authoritative) ----------
export const bundleOffer = { id: "bundle_3_999", collectionId: "c_three_for_999", size: 3, price: 99900, label: "Any 3 for ₹999", href: "/collections/3-for-999" } as const;
export const shippingRule = { freeThreshold: 299900, fee: 9900 } as const;

// ---------- Collection / filters ----------
export const priceBands = [
  { id: "under-2000", label: "Under ₹2,000", min: 0, max: 200000 },
  { id: "under-3000", label: "Under ₹3,000", min: 0, max: 300000 },
  { id: "3000-6000", label: "₹3,000 – ₹6,000", min: 300000, max: 600000 },
  { id: "over-6000", label: "Over ₹6,000", min: 600000, max: Number.MAX_SAFE_INTEGER },
] as const;

export const sortOptions = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
] as const;

export const filterCopy = {
  title: "Filter & sort",
  category: "Category",
  silhouette: "Silhouette",
  size: "Size",
  color: "Colour",
  price: "Price",
  material: "Material",
  availability: "Availability",
  inStock: "In stock only",
  sort: "Sort by",
  clearAll: "Clear all",
  apply: "Show results",
  results: (n: number) => `${n} ${n === 1 ? "piece" : "pieces"}`,
  empty: { title: "Nothing matches those filters", body: "Try removing a filter or two — or browse everything new this week." },
  latestDrop: "Latest drop",
} as const;

export const newIn = {
  title: "New In",
  description: "Everything that landed in the studio this season — clothing and sneakers, newest first.",
  seoDescription: "The newest clothing and sneakers from wavy.",
};

export const collectionsIndex = {
  title: "Collections",
  description: "Edits, drops and offers — each one a different way into the range.",
};

// ---------- Search ----------
export const searchCopy = {
  title: "Search",
  placeholder: "Search tees, linen, sneakers…",
  label: "Search the store",
  submit: "Search",
  popularTitle: "Popular searches",
  popular: ["hoodie", "linen", "sneakers", "cargo", "tee", "runner"],
  recentTitle: "Recent searches",
  clearRecent: "Clear",
  resultsFor: (q: string, n: number) => `${n} ${n === 1 ? "result" : "results"} for “${q}”`,
  emptyTitle: (q: string) => `No results for “${q}”`,
  emptyBody: "Check the spelling, try a broader word, or start from one of these.",
  shortcutsTitle: "Shop by category",
  newInCta: "Shop New In",
  recommendationsTitle: "You might also like",
  idleTitle: "What are you looking for?",
};

// ---------- Product ----------
export const productCopy = {
  inclusive: "Inclusive of all taxes",
  color: "Colour",
  size: "Size",
  sizeFinder: "Find my size",
  selectSize: "Select a size",
  soldOut: "Sold out",
  fewLeft: (n: number) => `Only ${n} left`,
  addToBag: "Add to bag",
  added: "Added to bag",
  notify: "Sold out in this colour",
  wishlistAdd: "Save to wishlist",
  wishlistRemove: "Remove from wishlist",
  details: "Details",
  material: "Material",
  construction: "Construction",
  fit: "Fit",
  care: "Care",
  trust: [
    { title: "Free delivery", body: "On orders above ₹2,999" },
    { title: "10-day returns", body: "Doorstep pickup, free exchanges" },
    { title: "Repair for a year", body: "Seams, zips and buttons on us" },
  ],
  recommendations: "Pairs well with",
  breadcrumbHome: "Home",
  footwearNote: "UK sizing. Most customers take their usual size.",
};

export const deliveryCopy = {
  title: "Check delivery",
  label: "Pincode",
  placeholder: "6-digit pincode",
  cta: "Check",
  invalid: "Enter a valid 6-digit Indian pincode.",
  loading: "Checking…",
  unavailable: "Live delivery checking is unavailable right now. Please try again later.",
  unserviceable: "Delivery is not available to this pincode right now.",
  codAvailable: "Cash on delivery available.",
  prepaidOnly: "Prepaid delivery available; cash on delivery is not supported for this pincode.",
  paymentUnavailable: "Delivery is available; payment options will be confirmed at checkout.",
  result: (days: string | null, payment: string) => `${days ? `Estimated delivery in ${days}.` : "Delivery is available."} ${payment}`,
};

/** Body measurements (cm) per apparel size. */
export const sizeChart = [
  { size: "XS", chest: 86, waist: 71 },
  { size: "S", chest: 94, waist: 79 },
  { size: "M", chest: 102, waist: 87 },
  { size: "L", chest: 110, waist: 95 },
  { size: "XL", chest: 118, waist: 103 },
];

export const sizeFinderCopy = {
  title: "Find your size",
  intro: "Four quick measurements. We compare them with this garment's chart and cut.",
  height: "Height (cm)",
  chest: "Chest (cm)",
  waist: "Waist (cm)",
  fit: "Preferred fit",
  fits: [
    { id: "slim", label: "Closer" },
    { id: "regular", label: "As designed" },
    { id: "relaxed", label: "Roomier" },
  ],
  submit: "Recommend a size",
  recommended: "We recommend",
  use: (s: string) => `Use size ${s}`,
  unavailable: "Heads up: this size is sold out in the selected colour.",
  error: "Please enter your height, chest and waist in centimetres.",
  howTo: "Measure around the fullest part of your chest and your natural waistline, tape level and snug.",
};

export const reviewsCopy = {
  title: "Reviews",
  basedOn: (n: number) => `Based on ${n} reviews`,
  verified: "Verified purchase",
  sort: "Sort reviews",
  sorts: [
    { id: "recent", label: "Most recent" },
    { id: "high", label: "Highest rated" },
    { id: "low", label: "Lowest rated" },
  ],
  all: "All",
  write: "Write a review",
  writeNote: "Reviews open once your order is delivered — find it under Account → Orders.",
  empty: "No reviews yet. Be the first once your order arrives.",
};

// ---------- Cart / wishlist ----------
export const cartCopy = {
  title: "Your bag",
  empty: { title: "Your bag is empty", body: "Start with something new — or the three-for-₹999 essentials." },
  emptyCta: "Shop New In",
  subtotal: "Subtotal",
  bundleDiscount: "Any 3 for ₹999",
  shipping: "Shipping",
  free: "Free",
  total: "Estimated total",
  taxNote: "Prices include GST. Final total confirmed at checkout.",
  freeShipLeft: (amount: string) => `You're ${amount} away from free shipping`,
  freeShipDone: "You've unlocked free shipping",
  nudge: (n: number) => `Add ${n} more essential${n === 1 ? "" : "s"} to get 3 for ₹999`,
  nudgeCta: "Shop essentials",
  checkout: "Checkout",
  viewBag: "View bag",
  continue: "Continue shopping",
  remove: "Remove",
  quantity: "Quantity",
  maxReached: "That's all we have in stock",
  couponLabel: "Promo code",
  couponPlaceholder: "Enter code",
  couponApply: "Apply",
  couponRemove: "Remove",
  couponApplied: (c: string) => `${c} applied — the discount is confirmed at checkout.`,
  couponFailed: "We couldn't apply that code. Check it and try again.",
  couponNote: "Discount confirmed at checkout",
  crossSells: "Complete your order",
};

export const wishlistCopy = {
  title: "Wishlist",
  intro: "Saved on this device. Sign in to keep it across devices.",
  empty: { title: "Nothing saved yet", body: "Tap the heart on anything you like and it'll wait for you here." },
  emptyCta: "Browse New In",
  moveToBag: "Move to bag",
  remove: "Remove",
  soldOut: "Sold out",
  chooseSize: "Size",
};

// ---------- Content pages ----------
export const faqCopy = {
  title: "Help & FAQ",
  intro: "Answers to what people ask us most. Still stuck? Write to us and a human replies within a working day.",
  searchLabel: "Search questions",
  searchPlaceholder: "Try “returns” or “COD”",
  noResults: "No questions match that search.",
  contact: "Email support",
};

export const faqs = [
  { id: "shipping", title: "Shipping & delivery", items: [
    { q: "How long does delivery take?", a: "Metro cities usually receive orders in 2 business days; everywhere else in 4–6. You'll get a tracking link by email and SMS as soon as your parcel leaves the studio." },
    { q: "Is shipping free?", a: "Shipping is free on orders above ₹2,999. Below that we charge a flat ₹99." },
    { q: "Do you offer cash on delivery?", a: "Yes, COD is available on most pincodes for orders up to ₹10,000." },
  ] },
  { id: "returns", title: "Returns & exchanges", items: [
    { q: "What is your return policy?", a: "You have 10 days from delivery to request a return or exchange. We collect from your door — no printing labels, no queues." },
    { q: "When will I get my refund?", a: "Refunds to UPI and cards are processed within 48 hours of the item reaching us. COD refunds go to your bank account or as store credit." },
    { q: "Can I exchange for a different size?", a: "Yes. Choose exchange in Account → Orders and we'll ship the new size as soon as the pickup is scanned." },
  ] },
  { id: "sizing", title: "Sizing & fit", items: [
    { q: "How do I pick the right size?", a: "Every product page has a size finder: enter height, chest and waist and we'll recommend a size for that specific cut." },
    { q: "Do sneakers run true to size?", a: "Most do. Where a style runs large or small we say so on the product page." },
  ] },
  { id: "product", title: "Products & care", items: [
    { q: "Where are your clothes made?", a: "Our cotton pieces are cut and sewn in Tirupur; leather and suede sneakers are made in Chennai and Agra." },
    { q: "Do you repair items?", a: "Yes — seams, buttons and zips are repaired free for the first year. Write to support with your order number." },
    { q: "How does virtual try-on work?", a: "On supported products, you can upload a photo to see a visualisation of the garment on you. Images are processed temporarily and deleted automatically." },
  ] },
];

export const about = {
  overline: "About wavy",
  title: "Fewer things, made heavier, made to last.",
  intro: "wavy started in 2021 in a Bengaluru flat with one heavyweight tee and a stubborn idea: that Indian-made basics could be the best in the world, at a price that makes sense here.",
  hero: img("1445205170230-053b83016050", "Studio rail of garments in warm light"),
  values: [
    { title: "Material first", body: "Certified organic cotton, European linen, Japanese selvedge and Chennai leather. We pay more for fibre so you pay less for replacements." },
    { title: "Made close to home", body: "Every mill and workshop we use is within a day's drive of our studio. We visit monthly, and we know the people who sew our clothes by name." },
    { title: "Service is the product", body: "Doorstep returns, free repairs for a year, and a real person on the other end of every email." },
  ],
  process: {
    title: "How a wavy tee gets made",
    steps: [
      { n: "01", title: "Yarn", body: "GOTS-certified cotton is spun in Coimbatore." },
      { n: "02", title: "Knit", body: "Knitted slowly on loopwheel machines in Tirupur." },
      { n: "03", title: "Cut & sew", body: "Cut in small batches, sewn with flatlock seams." },
      { n: "04", title: "Wash", body: "Garment-washed so it won't shrink in yours." },
    ],
  },
  image: img("1523381210434-271e8be1f52b", "Folded tees ready to ship"),
  cta: { label: "Shop the essentials", href: "/collections/studio-essentials" },
};

export const lookbook = {
  overline: "Lookbook",
  title: "Monsoon / 2026",
  intro: "Shot over three wet weeks between Fort Kochi and the Nilgiris. Every look links straight to the pieces in it.",
  shopLabel: "Shop the look",
  looks: [
    { id: "l1", title: "Harbour, 7 am", image: img("1515886657613-9f3515b0c78f", "Model in linen by the harbour"), productIds: ["p_008", "p_010", "p_020"], span: "tall" },
    { id: "l2", title: "Between showers", image: img("1487222477894-8943e31ef7b2", "Model in a shell jacket outdoors"), productIds: ["p_013", "p_012", "p_019"], span: "wide" },
    { id: "l3", title: "Studio hours", image: img("1552374196-1ab2a1c593e8", "Man in overshirt in the city"), productIds: ["p_007", "p_004", "p_015"], span: "wide" },
    { id: "l4", title: "Tea estate", image: img("1469334031218-e382a71b716b", "Model in soft light"), productIds: ["p_003", "p_011"], span: "tall" },
    { id: "l5", title: "Night market", image: img("1539109136881-3be0616acf4b", "Model in evening light"), productIds: ["p_005", "p_017"], span: "square" },
    { id: "l6", title: "Coastal road", image: img("1485968579580-b6d095142e6e", "Model walking outdoors"), productIds: ["p_006", "p_018"], span: "square" },
  ],
} as const;

export const journalCopy = {
  overline: "Journal",
  title: "Notes from the studio",
  intro: "Essays on materials, making and the cities we design for.",
  readMore: "Read story",
  back: "All stories",
  minRead: (n: number) => `${n} min read`,
  related: "Keep reading",
};

export const pageStates = {
  notFound: { title: "This page wandered off", body: "The link may be old, or the piece has sold through. Try search, or start from something new.", cta: "Back to home" },
  error: { title: "Something went wrong", body: "We couldn't load this page. It's us, not you — try again in a moment.", retry: "Try again" },
};
