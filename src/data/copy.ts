/**
 * UI microcopy ONLY: labels, headings and messages of fixed UI. No domain data lives here: products,
 * categories, collections, reviews, home sections, blog, FAQs, testimonials, navigation, shipping methods,
 * coupons, store name/support contacts and thresholds all come from Supabase via src/backend.
 */
import type { OrderStatus, PaymentStatus, ReturnReason, ShipmentStatus } from "@/types/domain";

export const headerCopy = {
  search: "Search", wishlist: "Wishlist", account: "Account", bag: "Bag",
  menu: "Open menu", closeMenu: "Close menu", allCategories: "All categories", collections: "Collections",
  admin: "Admin dashboard", primaryNav: "Primary", mobileNav: "Menu",
} as const;

export const footerCopy = {
  shop: "Shop", collections: "Collections", help: "Help", company: "Company",
  faq: "FAQ", blog: "Blog", track: "Track an order", account: "Account",
  newsletterLabel: "Email address", newsletterCta: "Subscribe", newsletterThanks: "You're on the list.",
  newsletterTitle: "New drops, restocks and the occasional note. No spam.", nav: "Footer",
} as const;

export const sortOptions = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
] as const;

export const filterCopy = {
  title: "Filter & sort", category: "Category", brand: "Brand", price: "Price", availability: "Availability",
  inStock: "In stock only", sort: "Sort by", clearAll: "Clear all", apply: "Show results", filters: "Filters",
  minPrice: "Min", maxPrice: "Max",
  results: (n: number) => `${n} ${n === 1 ? "product" : "products"}`,
  empty: { title: "Nothing matches those filters", body: "Try removing a filter or two." },
} as const;

export const collectionsIndexCopy = { title: "Collections", empty: "No collections yet." } as const;

export const searchCopy = {
  title: "Search", placeholder: "Search products, brands and categories", label: "Search the store", submit: "Search",
  recentTitle: "Recent searches", clearRecent: "Clear", suggestionsProducts: "Products", suggestionsCategories: "Categories",
  resultsFor: (q: string, n: number) => `${n} ${n === 1 ? "result" : "results"} for "${q}"`,
  emptyTitle: (q: string) => `No results for "${q}"`,
  emptyBody: "Check the spelling or try a broader word.",
  shortcutsTitle: "Shop by category", idleTitle: "What are you looking for?",
} as const;

export const productCopy = {
  inclusive: "Inclusive of all taxes", select: (name: string) => `Select ${name.toLowerCase()}`,
  soldOut: "Sold out", fewLeft: (n: number) => `Only ${n} left`, inStock: "In stock",
  addToBag: "Add to bag", added: "Added to bag", buyNow: "Buy now",
  wishlistAdd: "Save to wishlist", wishlistRemove: "Remove from wishlist",
  highlights: "Highlights", description: "Description", specifications: "Specifications",
  warranty: "Warranty", countryOfOrigin: "Country of origin", returns: "Returns",
  returnable: (days: number) => `Returnable within ${days} days of delivery`, notReturnable: "Not returnable",
  related: "You may also like", breadcrumbHome: "Home",
  relatedOverline: "Complete the look", viewAll: "View all products",
  from: "From", was: "Was", off: (pct: number) => `${pct}% off`,
  rated: (r: string) => `Rated ${r} out of 5`, reviewsCount: (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`,
} as const;

export const deliveryCopy = {
  title: "Check delivery", label: "Pincode", placeholder: "6-digit pincode", cta: "Check",
  invalid: "Enter a valid 6-digit Indian pincode.", loading: "Checking...",
  unavailable: "Delivery checking is unavailable right now. Please try again later.",
  unserviceable: "Delivery is not available to this pincode right now.",
  codAvailable: "Cash on delivery available.",
  prepaidOnly: "Prepaid delivery available; cash on delivery is not supported for this pincode.",
  result: (days: string | null, payment: string) => `${days ? `Estimated delivery in ${days}.` : "Delivery is available."} ${payment}`,
} as const;

export const reviewsCopy = {
  title: "Reviews", basedOn: (n: number) => `Based on ${n} ${n === 1 ? "review" : "reviews"}`,
  verified: "Verified purchase", sort: "Sort reviews",
  sorts: [
    { id: "recent", label: "Most recent" }, { id: "helpful", label: "Most helpful" },
    { id: "high", label: "Highest rated" }, { id: "low", label: "Lowest rated" },
  ],
  all: "All", write: "Write a review", submit: "Submit review", helpful: "Helpful", notHelpful: "Not helpful",
  submitted: "Thanks! Your review will appear once it's approved.", signInToReview: "Sign in to write a review.",
  empty: "No reviews yet.",
} as const;

export const cartCopy = {
  title: "Your bag", empty: { title: "Your bag is empty", body: "Add something you love to get started." }, emptyCta: "Continue shopping",
  subtotal: "Subtotal", discount: "Discount", shipping: "Shipping", codFee: "COD fee", tax: "Tax", taxIncluded: "Includes tax",
  free: "Free", total: "Total", taxNote: "Final total confirmed at checkout.",
  freeShipLeft: (amount: string) => `You're ${amount} away from free shipping`, freeShipDone: "You've unlocked free shipping",
  checkout: "Checkout", viewBag: "View bag", continue: "Continue shopping", remove: "Remove", quantity: "Quantity",
  maxReached: "That's all we have in stock", unavailable: "No longer available", reduceTo: (n: number) => `Only ${n} available`,
  couponLabel: "Promo code", couponPlaceholder: "Enter code", couponApply: "Apply", couponRemove: "Remove",
  couponApplied: (c: string) => `${c} applied`,
} as const;

/** Stable error codes from compute_pricing / coupon validation -> shopper-facing text. */
export const pricingErrors: Record<string, string> = {
  variant_not_found: "This item is no longer available.", unavailable: "This item is no longer available.",
  invalid_quantity: "Choose a quantity between 1 and 10.", insufficient_stock: "Not enough stock for this quantity.",
  shipping_method_unavailable: "That delivery option is not available.", gateway_disabled: "That payment method is unavailable.",
  cod_unavailable: "Cash on delivery is not available for this order.", cod_limit_exceeded: "This order is above the cash on delivery limit.",
  empty_cart: "Your bag is empty.",
  coupon_not_found: "We couldn't find that code.", coupon_inactive: "This code is not active.", coupon_not_started: "This code is not active yet.",
  coupon_expired: "This code has expired.", coupon_usage_limit_reached: "This code has reached its usage limit.",
  coupon_already_used: "You've already used this code.", coupon_first_order_only: "This code is for first orders only.",
  coupon_min_order_not_met: "Your bag doesn't meet this code's minimum order.", coupon_not_applicable: "This code doesn't apply to items in your bag.",
};

export const wishlistCopy = {
  title: "Wishlist", guestNote: "Saved on this device. Sign in to keep it across devices.",
  empty: { title: "Nothing saved yet", body: "Tap the heart on anything you like and it'll wait for you here." },
  emptyCta: "Start shopping", moveToBag: "Move to bag", remove: "Remove", soldOut: "Sold out",
} as const;

export const faqPageCopy = {
  title: "Help & FAQ", searchLabel: "Search questions", searchPlaceholder: "Search questions",
  noResults: "No questions match that search.", contact: "Contact support", empty: "No questions yet.",
  overline: "FAQs", heading: ["Questions,", "answered."], lede: "Orders, delivery, returns and payments: the things people ask us most.",
  topics: "Topics",
} as const;

export const blogCopy = {
  title: "Blog", readMore: "Read more", back: "All posts", minRead: (n: number) => `${n} min read`,
  related: "Keep reading", empty: "No posts yet.",
  overline: "Journal", lede: "Guides, stories and notes on the things we make and sell.", relatedOverline: "More from the journal",
} as const;

export const pageStates = {
  notFound: { title: "Page not found", body: "The link may be old or the item is no longer available.", cta: "Back to home", code: "(404)" },
  error: { title: "Something went wrong", body: "We couldn't load this page. Please try again in a moment.", retry: "Try again", overline: "Error" },
  loading: "Loading",
  unconfigured: "The store is being set up. Please check back soon.",
} as const;

// ---------- Checkout ----------
export const checkoutSteps = [
  { id: "contact", label: "Contact" }, { id: "address", label: "Address" },
  { id: "shipping", label: "Delivery" }, { id: "payment", label: "Payment" },
] as const;
export type CheckoutStepId = (typeof checkoutSteps)[number]["id"];

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

/** payment_failure_stage -> message. */
export const FAILURE_STAGES: Record<string, string> = {
  bank_declined: "Your bank declined the payment.", user_cancelled: "The payment was cancelled before it completed.",
  otp_timeout: "The payment timed out before it was authorised.", insufficient_funds: "The account had insufficient funds.",
  gateway_error: "The payment gateway had a temporary problem.", network_error: "We lost connection while confirming the payment.",
  signature_mismatch: "We couldn't verify the payment.", unknown: "The payment didn't go through.",
};

export const checkoutCopy = {
  secureBadge: "Secure checkout", loginPrompt: "Have an account?", loginCta: "Log in for faster checkout",
  emptyTitle: "Your bag is empty", emptyBody: "Add a few items before checking out.", placeOrder: "Place order", pay: "Pay now",
  saveAddress: "Save this address", failureTitle: "Payment didn't go through",
  failureNoCharge: "Your order is saved. If any amount was debited it will be refunded automatically; retrying will not charge you twice.",
  retry: "Retry payment", otherMethod: "Choose another method", support: "Need help? Contact us with your order number",
  successTitle: "Thank you, your order is placed", guestPrompt: "Create an account to track orders and check out faster next time.",
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
} as const;

// ---------- Account / orders / returns ----------
export const accountNav = [
  { href: "/account", label: "Account" }, { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" }, { href: "/account/profile", label: "Profile" },
  { href: "/account/returns", label: "Returns" }, { href: "/wishlist", label: "Wishlist" },
] as const;

export const authCopy = {
  login: { overline: "Log in", title: "Welcome back", body: "Log in to track orders, manage returns and check out faster." },
  signup: { overline: "Join", title: "Create your account", body: "Save addresses and track every order." },
  forgot: { overline: "Account help", title: "Reset your password", body: "Enter your email and we'll send a secure reset link.", sent: "If an account exists for that email, a reset link is on its way." },
  panel: {
    label: "Why create an account", overline: "Members", heading: ["Everything you order,", "in one place."],
    body: "One account for tracking, returns and faster checkout.",
    perks: ["Live order tracking", "Saved addresses for quicker checkout", "Returns started from your account"],
  },
  terms: "I agree to the Terms of Service and Privacy Policy.",
  notConfigured: "Accounts aren't available yet. You can still check out as a guest.",
} as const;

export const accountCopy = {
  ordersEmpty: "You haven't placed any orders yet.", returnsEmpty: "No return requests yet.", addressesEmpty: "No saved addresses yet.",
  cancel: "Cancel order", cancelConfirm: "Cancel this order?", cancelled: "Your order has been cancelled.",
  returnNotEligible: "This order has no items eligible for return.", requestReturn: "Request a return",
  trackingHelp: "Questions about your delivery? Contact us and quote your order number.",
} as const;

export const returnReasonLabels: Record<ReturnReason, string> = {
  size_too_small: "Size too small", size_too_large: "Size too large", defective: "Defective", damaged_in_transit: "Damaged in transit",
  wrong_item: "Received the wrong item", missing_parts: "Missing parts", not_as_described: "Not as described",
  changed_mind: "Changed my mind", other: "Other",
};
export const evidenceRules = { maxFiles: 3, maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] } as const;

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment", paid: "Confirmed", processing: "Processing", packed: "Packed", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", return_requested: "Return requested", returned: "Returned", refunded: "Refunded",
};
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  initiated: "Pending", authorized: "Authorised", captured: "Paid", failed: "Failed", refunded: "Refunded", partially_refunded: "Partially refunded",
};
export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  created: "Label created", picked_up: "Picked up", in_transit: "In transit", out_for_delivery: "Out for delivery",
  delivered: "Delivered", exception: "Delivery issue", cancelled: "Cancelled",
};

// ---------- Admin console ----------
export const adminCopy = {
  brand: "wavy", brandTag: "Admin", navLabel: "Admin",
  openNav: "Open navigation", close: "Close", collapse: "Collapse sidebar", expand: "Expand sidebar",
  breadcrumb: "Breadcrumb", root: "Admin", newCrumb: "New",
  previewRole: "Preview role", viewStore: "View store", staffFallback: "Staff",
  noAccess: {
    title: "No access", thisPage: "this page", cta: "Back to dashboard",
    body: (role: string, page: string) => `Your role (${role}) can't open ${page}. Ask a super admin if you need it.`,
  },
  table: {
    search: "Search", filterBy: (label: string) => `Filter by ${label}`, all: "All", clear: "Clear", clearFilters: "Clear filters",
    selected: (n: number) => `${n} selected`, bulkActions: "Bulk actions", selectPage: "Select all rows on this page",
    selectRow: (id: string) => `Select row ${id}`, noMatches: "No matches", noMatchesBody: "Try a different search or clear the filters.",
    emptyTitle: "Nothing here yet", range: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
    noResults: "0 results", previous: "Previous", next: "Next",
  },
  editor: {
    save: "Save", cancel: "Cancel", delete: "Delete", confirmDelete: "Confirm delete", irreversible: "This cannot be undone.",
  },
} as const;
