/**
 * Storefront UI microcopy that `copy.ts` does not cover yet (quick view, home, PDP details, reviews form,
 * pagination, collections, footer). UI labels only: domain content comes from Supabase.
 */
export const quickViewCopy = {
  open: (name: string) => `Quick view: ${name}`,
  label: "Quick view",
  viewDetails: "View full details",
  close: "Close quick view",
  dragToClose: "Drag down to close",
} as const;

export const floatingCardCopy = {
  region: "Product spotlight",
  kind: { new: "New arrival", bestseller: "Bestseller" },
  move: "Move product spotlight. Drag, or use the arrow keys.",
  pause: "Pause product spotlight",
  play: "Resume product spotlight",
  close: "Close product spotlight",
  minimise: "Minimise product spotlight",
  expand: (name: string) => `Show product spotlight: ${name}`,
} as const;

export const homeCopy = {
  empty: { title: "The shelves are being stocked", body: "Our first products are on their way. Check back soon.", cta: "Browse collections" },
  viewAll: "View all",
  shopNow: "Shop now",
  showcaseHint: "Tap a product for a closer look",
  useCode: "Use code",
  copyCode: "Copy code",
  copied: "Code copied",
  products: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
  slideshow: "Featured",
  /** Small overline above each home section heading, per section kind / product source. */
  overline: {
    categories: "Departments",
    blog: "Journal",
    products: { featured: "Featured", new: "Just in", best_rated: "Top rated", collection: "Curated", category: "Curated", manual: "Hand-picked" },
  },
  railPrev: "Previous products",
  railNext: "Next products",
  railPause: "Pause carousel",
  railPlay: "Play carousel",
  categoryPrev: "Previous categories",
  categoryNext: "Next categories",
  categoryTabs: { all: "All", label: "Departments" },
  /** subcategory_grid: tab strip + offer line ("Up to 40% off" / "From ₹1,299"). */
  subcategories: {
    overline: "Categories", tabs: "Filter categories by department",
    upTo: (pct: number) => `Up to ${pct}% off`, from: (price: string) => `From ${price}`,
  },
  testimonialsChip: "Testimonials",
  quotes: "Customer reviews",
  faq: { overline: "FAQs", title: "Questions, answered.", body: "The things shoppers ask us most.", all: "All questions" },
} as const;

/** Home dark stages: hero carousel, lookbook rail, promo band. */
export const homeStageCopy = {
  prev: "Previous slide",
  next: "Next slide",
  pause: "Pause slideshow",
  play: "Play slideshow",
  slideOf: (i: number, n: number) => `${i} of ${n}`,
  nextUp: (heading: string) => `Next slide: ${heading}`,
  lookbookOverline: "Selected edits",
  lookbookCount: (n: number) => `Collections (${n})`,
  drag: "Drag to slide",
  prevCollection: "Previous collection",
  nextCollection: "Next collection",
} as const;

export const pdpCopy = {
  quantity: "Quantity",
  youSave: (amount: string) => `You save ${amount}`,
  details: "Product details",
  weight: "Weight",
  dimensions: "Dimensions",
  brand: "Brand",
  general: "General",
  images: (name: string) => `${name} images`,
  showImage: (n: number) => `Show image ${n}`,
  reviewsLink: (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`,
  noImage: "No image available",
  prevImage: "Previous image",
  nextImage: "Next image",
  addBar: "Add to bag bar",
} as const;

export const reviewFormCopy = {
  rating: "Your rating",
  star: (n: number) => `${n} ${n === 1 ? "star" : "stars"}`,
  title: "Title",
  body: "Your review",
  bodyHint: "At least 10 characters.",
  name: "Display name",
  location: "City (optional)",
  signIn: "Sign in",
  duplicate: "You've already reviewed this product.",
  failed: "We couldn't submit your review. Please try again.",
  voted: "Thanks for your feedback.",
  helpfulCount: (n: number) => `${n} found this helpful`,
  loadFailed: "We couldn't load reviews. Please try again.",
} as const;

export const paginationCopy = {
  label: "Pagination",
  prev: "Previous",
  next: "Next",
  page: (p: number, total: number) => `Page ${p} of ${total}`,
} as const;

export const collectionCopy = {
  categories: "Shop by category",
  collections: "Collections",
  subcategories: "Browse",
  siblings: (parent: string) => `More in ${parent}`,
  allIn: (name: string) => `All ${name}`,
  emptyScope: { title: "Nothing here yet", body: "New products are added regularly. Check back soon." },
  browse: "Browse all collections",
  priceApply: "Apply",
  priceRange: (min: string, max: string) => `${min} – ${max}`,
  updating: "Updating…",
  activeFilters: "Active filters",
  removeFilter: (label: string) => `Remove filter ${label}`,
} as const;

export const layoutCopy = {
  skip: "Skip to content",
  storeFallback: "Store",
  home: (store: string) => `${store}, home`,
  freeShipping: (amount: string) => `Free delivery on orders over ${amount}`,
  rights: (year: number, store: string) => `© ${year} ${store}. All rights reserved.`,
  support: "Customer support",
  shopAll: "Shop all",
  searchTitle: "Search the store",
  viewAllResults: (q: string) => `See all results for "${q}"`,
  searching: "Searching…",
  noSuggestions: "No quick matches. Press enter to search everything.",
  suggestionsCollections: "Collections",
  suggestionsLabel: "Search suggestions",
  suggestionCount: (n: number) => `${n} ${n === 1 ? "suggestion" : "suggestions"}, use the up and down arrows to browse.`,
  searchError: "Suggestions are unavailable right now. Press enter to search everything.",
  retry: "Try again",
} as const;

export const mobileMenuCopy = {
  toggle: (name: string) => `${name} sub-categories`,
} as const;

export const contentCopy = {
  notFound: "This page isn't available yet.",
  faqGeneral: "General",
} as const;

/** TearReveal (home "tear_reveal" sections, 404): the poster that rips open as you scroll. */
export const tearRevealCopy = {
  hint: "Scroll",
  tiger: (word: string, tagline?: string) => `${tagline ? `${tagline}. ` : ""}${word}, a poster torn in two by a tiger looking through.`,
  notFoundWord: "404",
  image: (word: string, tagline?: string) => `${tagline ? `${tagline}. ` : ""}${word}, a poster tearing open onto a campaign photo.`,
} as const;

/** Storefront preloader (first visit per session). The cover itself is aria-hidden; this is its sr-only status. */
export const preloaderCopy = {
  status: (store: string) => `Loading ${store}`,
} as const;
