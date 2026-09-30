/**
 * Storefront UI microcopy that `copy.ts` does not cover yet (quick view, home, PDP details, reviews form,
 * pagination, collections, footer). UI labels only: domain content comes from Supabase.
 */
export const quickViewCopy = {
  open: (name: string) => `Quick view: ${name}`,
  label: "Quick view",
  viewDetails: "View full details",
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
} as const;

export const contentCopy = {
  notFound: "This page isn't available yet.",
  faqGeneral: "General",
} as const;
