/**
 * UI microcopy ONLY: labels, headings and messages of fixed UI. No domain data lives here: products,
 * categories, collections, reviews, home sections, blog, FAQs, testimonials, navigation, shipping methods,
 * coupons, store name/support contacts and thresholds all come from Supabase via src/backend.
 */
import type { OrderStatus, PaymentStatus, ReturnReason, ShipmentStatus } from "@/types/domain";

/** Shared UI primitives (components/ui): Drawer, Carousel, QuantityStepper. */
export const uiCopy = {
  close: "Close", prevSlide: "Previous slide", nextSlide: "Next slide", play: "Play slideshow", pause: "Pause slideshow",
  slideOf: (i: number, n: number) => `${i} of ${n}`, goToSlide: (i: number) => `Go to slide ${i}`,
  decrease: "Decrease quantity", increase: "Increase quantity",
  noMatches: "No matches", loadingOptions: "Loading...", showOptions: "Show options",
} as const;

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
  backToTop: "Back to top",
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

/** Address form helpers shared by checkout Delivery and account Addresses: pincode lookup, city list, map + location. */
export const addressCopy = {
  pin: {
    looking: (pin: string) => `Looking up ${pin}...`, found: (place: string) => `${place} ✓`,
    notFound: "Couldn't find this PIN, enter city and state", failed: "Couldn't look up this PIN right now, enter city and state",
  },
  cityPlaceholder: "Pick or type your city", statePlaceholder: "Select state", localityPlaceholder: "Pick or type your area",
  useLocation: "Use my current location",
  map: {
    title: "Pin your delivery location", region: "Map. Drag or use the arrow keys to move the pin, plus and minus to zoom.",
    search: "Search area, street or landmark", searchPlaceholder: "e.g. Hawa Mahal, Jaipur", locate: "Locate me", relocate: "Try again",
    drag: "Drag the map to put the pin on your door.", loadingMap: "Loading map...",
    subtitle: "Find yourself on the map and we'll fill in the address.", showMap: "Open map", hideMap: "Hide map",
    recenter: "Back to my location", zoomIn: "Zoom in", zoomOut: "Zoom out", live: "Live", off: "Location off", idle: "Drag or search",
    locating: "Locating...", refining: (acc: string) => `Refining location... ${acc}`, accuracy: (acc: string) => `Accurate to ${acc}`,
    signal: ["", "Weak signal", "Fair signal", "Good signal", "Strong signal"],
    coarse: "This device is estimating from Wi-Fi or network, so it can be off by a few hundred metres. Drag the map to correct the pin.",
    finding: "Finding the address...", pinnedAt: "Delivering to", noAddress: "We couldn't name this spot. Use it and fill in the rest below.",
    fields: { line: "Street", locality: "Area", city: "City", state: "State", pin: "PIN" }, use: "Use this address",
    denied: "Location access is blocked for this site.",
    deniedHelp: [
      "Chrome / Edge: click the icon left of the address bar, then Site settings, Location, Allow, and reload.",
      "Safari (iPhone): Settings, Apps, Safari, Location, Allow. Safari (Mac): Safari, Settings for this website, Location, Allow.",
      "Firefox: click the permissions icon in the address bar and clear the Location block.",
    ],
    unavailable: "Your device couldn't determine a location. Check that location services are on, or search instead.",
    timeout: "Finding your location took too long. Try again, or search for your area.",
    insecure: "Location needs a secure (https) connection. Search for your area or drag the map instead.",
    unsupported: "This browser can't share your location. Search for your area or drag the map instead.",
    manual: "You can still search, drag the map, or type the address in the fields.",
  },
  /** ±25 m / ±1.2 km */
  accuracy: (m: number) => (m < 1000 ? `±${Math.max(1, Math.round(m))} m` : `±${(m / 1000).toFixed(1)} km`),
} as const;

// ---------- GST invoice (document + access UI) ----------
export const invoiceCopy = {
  title: "Tax invoice", heading: "Invoice", date: "Invoice date", order: "Order no.", orderDate: "Order date",
  placeOfSupply: "Place of supply", payment: "Payment", reference: "Reference", billTo: "Bill to", shipTo: "Ship to", details: "Details",
  gstin: "GSTIN", state: "State", unregistered: "Not registered",
  cols: {
    index: "#", item: "Item", hsn: "HSN", qty: "Qty", price: "Price", discount: "Discount", taxable: "Taxable",
    cgst: "CGST", sgst: "SGST", igst: "IGST", amount: "Amount",
  },
  taxableValue: "Taxable value", roundOff: "Round off", totalIn: (currency: string) => `Total (${currency})`,
  inWords: "Amount in words", rate: (r: number) => `${r}%`, half: (r: number) => `${Math.round((r / 2) * 100) / 100}%`,
  inclusive: "Prices include GST.", exclusive: "GST is charged on top of listed prices.", reverseCharge: "Tax payable on reverse charge: No.",
  computer: "This is a computer-generated invoice and needs no signature.",
  paymentStatus: { paid: "Paid online", cod: "Cash on delivery", none: "No payment due" },
  methods: { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", emi: "EMI", paylater: "Pay later", cod: "Cash" } as Record<string, string>,
  shipping: "Shipping", codFee: "Cash handling fee", sku: "SKU",
  download: "Download invoice", downloadPdf: "Download PDF", view: "View invoice",
  guestNote: "Save this now: you won't be able to view this invoice again because you're not signed in. Create an account to keep your orders.",
  createAccount: "Create account",
  pendingCod: "Your GST invoice is issued when your order is dispatched.",
  pendingPayment: "Your invoice will be ready once the payment is confirmed. Refresh this page in a minute.",
  admin: {
    panel: "Invoice", none: "No invoice yet. It is issued when the order is paid (COD: when it is packed or shipped).",
    issued: (n: string, d: string) => `${n} · issued ${d}`, regenerate: "Regenerate PDF", regenerated: "Invoice PDF regenerated",
    bulk: "Download invoices", range: "Download all for date range", selected: (n: number) => `${n} selected`,
    selectPage: "Select all orders on this page", selectRow: (n: string) => `Select order ${n}`, max: (n: number) => `Up to ${n} at a time`,
    failed: "Couldn't download invoices", skipped: (n: number) => `${n} order${n === 1 ? "" : "s"} skipped (no invoice yet)`,
  },
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
  dropzone: {
    browse: "Drag images here or click to browse", browseOne: "Drag an image here or click to browse",
    replaceOne: "Drop or pick a new image to replace this one",
    hint: (formats: string, mb: number) => `${formats}, up to ${mb} MB`, or: "or",
    skipped: (n: number, list: string) => `${n} file${n === 1 ? "" : "s"} skipped: ${list}.`,
    reason: {
      notImage: "not an image", heic: "HEIC isn't supported, export it as JPEG or PNG",
      format: (formats: string) => `use ${formats}`, size: (mb: number) => `over ${mb} MB`, count: (n: number) => `only ${n} allowed`,
    },
    selected: "Selected images", cover: "Cover", alt: (i: number) => `Alt text, image ${i}`, altPlaceholder: "Describe the image",
    up: (i: number) => `Move image ${i} up`, down: (i: number) => `Move image ${i} down`, remove: (i: number) => `Remove image ${i}`,
    noImage: "No image yet",
  },
  homeSections: {
    preview: "Preview", previewNote: "Live mock, updates as you type. Not to scale.", noPreview: "Nothing to preview yet",
    slide: (i: number) => `Show slide ${i}`, slides: "Slides", heading: "Heading", word: "WORD",
    upTo: (n: number) => `Up to ${n}`, all: (what: string) => `All ${what}`, pickSource: "Pick where products come from",
    fromSource: (s: string) => `From: ${s}`, testimonialsNote: "Latest approved testimonials", postsNote: "Latest published posts",
    emailPlaceholder: "Email address", subscribe: "Subscribe", tigerAlt: "Tiger illustration",
    unsaved: "Unsaved changes", isNew: "New, not saved", active: "Active", inactive: "Inactive",
    moveUp: (s: string) => `Move ${s} up`, moveDown: (s: string) => `Move ${s} down`,
    fixFields: (n: number) => `${n} field${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} attention. Check the messages above.`,
    endsBeforeStart: "End must be after the start",
    required: "Required", imageRequired: "Add an image", altRequired: "Add alt text: a few words describing the image",
    addOne: "Add at least one", min: (n: number | bigint) => `Must be at least ${n}`,
    max: (n: number | bigint) => `Must be at most ${n}`, maxChars: (n: number | bigint) => `Keep it under ${n} characters`,
  },
  remove: {
    delete: "Delete", cancel: "Keep it", deleteLabel: (what: string) => `Delete ${what}`,
    reviewTitle: "Delete this review?",
    reviewBody: (author: string, product: string) => `The review by ${author} on ${product} is removed for good, with its photos and votes. This can't be undone.`,
    reviewsTitle: (n: number) => `Delete ${n} review${n === 1 ? "" : "s"}?`,
    reviewsBody: "The selected reviews are removed for good, with their photos and votes. Product ratings update right away. This can't be undone.",
    reviewDeleted: "Review deleted", reviewsDeleted: (n: number) => `${n} review${n === 1 ? "" : "s"} deleted`,
    testimonialTitle: "Delete this testimonial?",
    testimonialBody: (author: string) => `The testimonial from ${author} is removed from the storefront for good. This can't be undone.`,
    testimonialDeleted: "Testimonial deleted",
    failed: "Couldn't delete", select: (what: string) => `Select ${what}`,
    confirmTitle: (n: number, one: string, many: string) => (n === 1 ? `Delete this ${one}?` : `Delete ${n} ${many}?`),
    done: (deleted: number, archived: number, one: string, many: string, kept: string) => [
      deleted ? `${deleted} ${deleted === 1 ? one : many} deleted` : "",
      archived ? `${archived} ${kept}` : "",
    ].filter(Boolean).join(", "),
    /** Keyed by admin API resource. `effect` is the confirm-dialog body: what happens to dependent data. */
    nouns: {
      products: { one: "product", many: "products", kept: "archived (used by orders or discount rules)",
        effect: "Products with orders or coupon/offer rules are archived instead, so order history stays intact. The rest are removed for good with their variants, stock, images and reviews. This can't be undone." },
      categories: { one: "category", many: "categories", kept: "",
        effect: "Categories that still have products, or are used by coupon/offer rules, can't be deleted: move those first. Sub-categories move up to the nearest remaining parent. Images are removed. This can't be undone." },
      collections: { one: "collection", many: "collections", kept: "",
        effect: "Products stay in the catalog; only their membership is removed. Collections used by coupon/offer rules can't be deleted. Images are removed. This can't be undone." },
      coupons: { one: "coupon", many: "coupons", kept: "archived (used on orders)",
        effect: "Coupons already used on orders are archived instead, so order records stay intact. The rest are removed for good with their targeting rules." },
      offers: { one: "offer", many: "offers", kept: "archived (applied to orders)",
        effect: "Offers already applied to orders are archived instead. The rest are removed for good with their targeting rules. Linked campaigns keep running without them." },
      campaigns: { one: "campaign", many: "campaigns", kept: "",
        effect: "Campaigns are removed for good with their product and collection links. Linked coupons and offers are not affected." },
      blog: { one: "post", many: "posts", kept: "", effect: "Posts are removed from the journal for good, with their tag links. This can't be undone." },
      faqs: { one: "FAQ", many: "FAQs", kept: "", effect: "These questions are removed from the help pages for good. This can't be undone." },
      pages: { one: "page", many: "pages", kept: "", effect: "These pages are removed for good and their links will 404. Add a redirect if they were public. This can't be undone." },
      testimonials: { one: "testimonial", many: "testimonials", kept: "", effect: "These quotes are removed from the storefront for good. This can't be undone." },
      "home-sections": { one: "section", many: "sections", kept: "", effect: "These sections are removed from the home page for good. This can't be undone." },
      "seo-overrides": { one: "override", many: "overrides", kept: "", effect: "These paths go back to their default metadata." },
      redirects: { one: "redirect", many: "redirects", kept: "", effect: "These old paths stop redirecting and may 404." },
      "shipping-zones": { one: "zone", many: "zones", kept: "switched off (used by orders)",
        effect: "Zones with methods used by past orders are switched off instead. The rest are removed with their methods. The default zone can't be deleted." },
      "shipping-methods": { one: "method", many: "methods", kept: "switched off (used by orders)",
        effect: "Methods used by past orders are switched off instead, so order records stay intact. The rest are removed for good." },
    },
  },
} as const;

/** Admin > Products > Import from Excel (dialog) and the Instructions sheet of the generated template. */
export const catalogImportCopy = {
  open: "Import from Excel", title: "Import from Excel",
  intro: "Download the template, fill it in, then upload it. You'll see a preview first: nothing is saved until you confirm.",
  download: "Download template", templateHint: "The template lists your current categories and collections.",
  fileLabel: "Upload the filled template", fileHint: (mb: number, rows: number) => `.xlsx only, up to ${mb} MB and ${rows.toLocaleString("en-IN")} rows`,
  browse: "Drag the file here or click to browse", chosen: (name: string) => `Selected: ${name}`,
  wrongType: "Choose an Excel workbook (.xlsx).", tooBig: (mb: number) => `This file is over ${mb} MB. Split it into smaller files.`,
  check: "Check file", confirm: (n: number) => `Import ${n} change${n === 1 ? "" : "s"}`, another: "Choose another file", cancel: "Cancel", close: "Close",
  summary: "What will change", item: "Item", new: "New", updated: "Updated", unchanged: "Unchanged",
  entities: { categories: "Categories", collections: "Collections", products: "Products", variants: "Variants" },
  memberships: (n: number) => `${n} product${n === 1 ? "" : "s"} to add to collections.`,
  errors: (n: number) => `${n} problem${n === 1 ? "" : "s"} to fix in the file, then upload it again`,
  warnings: (n: number) => `${n} note${n === 1 ? "" : "s"}`,
  more: (shown: number, total: number) => `Showing the first ${shown} of ${total}.`,
  sheet: "Sheet", row: "Row", column: "Column", problem: "Problem", wholeRow: "Whole row",
  ready: "No problems found. Check the counts, then import.", nothing: "Everything in this file already matches the store. There's nothing to import.",
  done: (n: number) => `Import complete: ${n} change${n === 1 ? "" : "s"} saved`, failed: "Import failed", checkFailed: "Couldn't read the file",
  template: {
    title: "How to fill this template",
    rules: [
      "1. Fill in the Categories, Collections, Products and Variants sheets. You can leave any sheet empty.",
      "2. Keep row 1 (the column names) as it is. Columns marked * are required for new rows. Hover a column name for help.",
      "3. Rows starting with EXAMPLE are samples. The importer skips them, so you can leave them or delete them.",
      "4. Re-importing is safe: categories, collections and products are matched by slug and variants by SKU. Matches are updated, everything else is created, and nothing is deleted.",
      "5. A blank cell on something that already exists keeps its current value. To clear a value, use the editor in admin.",
      "6. Prices are in rupees, e.g. 1499 or 1499.50. The store converts them to paise.",
      "7. Lists are comma-separated: Collections, Tags, Badges, Options, and the Products column on the Collections sheet.",
      "8. Yes/no columns take yes or no.",
      "9. Products with options (e.g. Size, Colour): put the option names in Options, then add one Variants row per combination with the values in Option 1, 2 and 3, in the same order.",
      "10. Products without options: leave Options blank and fill Price (plus SKU and Stock if you like) on the Products sheet. A blank SKU is made from the slug.",
      "11. Stock is opening stock for new variants only. Change the stock of existing variants in Admin > Inventory.",
      "12. Images aren't imported. Add them in the product editor after the import.",
      "13. New products are saved as drafts unless Status says otherwise. Publishing needs the catalog.publish permission.",
      "14. Up to 2,000 rows and 5 MB per file. Upload it in Admin > Products > Import from Excel to see a preview and any problems before anything is saved.",
    ],
    exampleTitle: "The example rows",
    example: [
      "EXAMPLE Handloom cotton kurta has two options (Size, Colour), so its prices are on the Variants sheet: one row per size and colour, each with its own SKU, price and opening stock.",
      "EXAMPLE Silver jhumka earrings has no options, so its SKU, price and stock are on the Products sheet and it has no Variants rows.",
      "EXAMPLE Festive edit (Collections) adds the kurta to that collection. The Collections column on the Products sheet does the same from the product's side.",
    ],
    columnsTitle: (sheet: string) => `${sheet} sheet`, column: "Column", required: "Required", notes: "What to enter", yes: "yes",
  },
} as const;
