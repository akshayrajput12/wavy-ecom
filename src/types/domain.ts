/**
 * Shared domain contract: UI, backend services and the SQL schema all agree on these.
 * Money is ALWAYS integer paise (Rs 1 = 100). Ids are uuid strings. Timestamps are ISO strings.
 * Enum values mirror the Postgres enums in supabase/migrations exactly (see docs/database/SCHEMA.md).
 */

// ---------- Enums ----------
export const PRODUCT_STATUS = ["draft", "published", "unpublished", "archived"] as const;
export const VARIANT_STATUS = ["active", "out_of_stock", "disabled"] as const;
export const ORDER_STATUS = [
  "pending_payment", "paid", "processing", "packed", "shipped", "delivered",
  "cancelled", "return_requested", "returned", "refunded",
] as const;
export const PAYMENT_STATUS = ["initiated", "authorized", "captured", "failed", "refunded", "partially_refunded"] as const;
export const SHIPMENT_STATUS = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception", "cancelled"] as const;
export const RETURN_STATUS = ["requested", "approved", "rejected", "pickup_scheduled", "received", "refunded", "closed"] as const;
export const RETURN_REASON = [
  "size_too_small", "size_too_large", "defective", "damaged_in_transit", "wrong_item",
  "missing_parts", "not_as_described", "changed_mind", "other",
] as const;
export const REVIEW_STATUS = ["pending", "approved", "rejected", "hidden"] as const;
export const COUPON_STATUS = ["draft", "active", "paused", "expired", "archived"] as const;
export const CAMPAIGN_STATUS = ["draft", "scheduled", "live", "paused", "completed", "archived"] as const;
export const INTEGRATION_STATUS = ["connected", "needs_attention", "disconnected"] as const;
export const USER_ROLE = [
  "customer", "super_admin", "catalog_manager", "order_manager", "marketing_manager", "analyst", "support_agent",
] as const;
export const PAYMENT_PROVIDER = ["razorpay", "payu", "cod"] as const;
export const HOME_SECTION_TYPE = [
  "hero_carousel", "category_grid", "collection_rail", "product_carousel", "floating_showcase",
  "promo_banner", "testimonials", "blog_rail", "newsletter", "tear_reveal",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type VariantStatus = (typeof VARIANT_STATUS)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];
export type ReturnStatus = (typeof RETURN_STATUS)[number];
export type ReturnReason = (typeof RETURN_REASON)[number];
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
export type CouponStatus = (typeof COUPON_STATUS)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];
export type IntegrationStatus = (typeof INTEGRATION_STATUS)[number];
export type UserRole = (typeof USER_ROLE)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDER)[number];
export type HomeSectionType = (typeof HOME_SECTION_TYPE)[number];

// ---------- Shared ----------
export interface Media { url: string; alt: string; width?: number; height?: number }
export interface Seo { title?: string; description?: string; ogImage?: string; canonical?: string; noindex?: boolean }
export interface Cta { label: string; href: string }
/** One selected option value, e.g. {name: "Color", value: "Black"}. */
export interface OptionValue { name: string; value: string }
export interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number }

// ---------- Catalog ----------
export interface CategoryRef { id: string; name: string; slug: string }
export interface Category extends CategoryRef {
  parentId: string | null; description?: string; image?: Media; banner?: Media;
  sortOrder: number; isActive: boolean; showOnHome: boolean; seo?: Seo;
  /** Only populated by tree queries (listCategories). */
  children?: Category[];
}
export interface Collection {
  id: string; name: string; slug: string; description?: string; image?: Media; banner?: Media;
  sortOrder: number; showOnHome: boolean; startsAt?: string; endsAt?: string; productCount?: number; seo?: Seo;
}
export interface ProductSpecification { group?: string; label: string; value: string }
export interface ProductDimensions { lengthMm?: number; widthMm?: number; heightMm?: number }
export interface ProductVariant {
  id: string; productId: string; sku: string;
  /** Derived label, "Black / M" or "Default". */
  title: string;
  /** In `Product.optionNames` order. */
  options: OptionValue[];
  colorHex?: string; price: number; compareAt?: number;
  /** Available units (on_hand - reserved). */
  stock: number; status: VariantStatus; image?: Media;
}
export interface Product {
  id: string; slug: string; name: string; brand?: string;
  shortDescription: string; description: string; highlights: string[];
  specifications: ProductSpecification[]; tags: string[];
  categoryId: string; category?: CategoryRef; collectionIds: string[];
  /** 0-3 option axes, e.g. ["Color","Size"], ["Storage"], []. */
  optionNames: string[];
  images: Media[]; badges: string[]; status: ProductStatus; isFeatured: boolean;
  weightGrams?: number; dimensions?: ProductDimensions; hsnCode?: string; countryOfOrigin?: string;
  warranty?: string; returnable: boolean; returnWindowDays?: number;
  /** Display values (marketing override applied). */
  rating: number; reviewCount: number;
  priceFrom: number; compareAtFrom?: number;
  variants: ProductVariant[]; seo?: Seo;
}
/** One product in the storefront's floating spotlight card, tagged with the set it came from. */
export interface SpotlightItem { product: Product; kind: "new" | "bestseller" }

// ---------- Cart / pricing ----------
export interface CartLine {
  id: string; variantId: string; productId: string; slug?: string; name: string; brand?: string; image: Media;
  variantTitle: string; options: OptionValue[];
  unitPrice: number; compareAt?: number; quantity: number; maxQuantity: number;
}
export interface OfferNudge { offerId: string; message: string; itemsNeeded: number }
/** Server-authoritative totals (paise). */
export interface CartTotals {
  subtotal: number; discount: number; shipping: number; codFee?: number; tax: number; total: number;
  appliedCoupon?: string;
  offerNudges: OfferNudge[];
}
export interface QuoteLine {
  variantId: string; productId: string; categoryId: string; sku: string; name: string; brand?: string; slug: string;
  variantTitle: string; options: OptionValue[]; image?: string;
  unitPrice: number; compareAtPrice?: number; quantity: number; maxQuantity: number;
  lineSubtotal: number; discount: number; lineTotal: number; hsnCode?: string; returnWindowDays: number;
}
/** Line codes: variant_not_found|unavailable|invalid_quantity|insufficient_stock; others: shipping_method_unavailable|gateway_disabled|cod_unavailable|cod_limit_exceeded|empty_cart */
export interface QuoteError { code: string; variantId?: string; available?: number; provider?: string; max?: number }
export interface QuoteCoupon {
  id: string | null; code: string; type: "percent" | "fixed" | "free_shipping" | null;
  valid: boolean; error: string | null; discount: number; freeShipping: boolean;
}
export interface AppliedDiscount {
  kind: "offer" | "coupon"; id: string; name?: string; code?: string; type?: string;
  amount: number; applications?: number; freeShipping?: boolean;
}
export interface CartQuote extends CartTotals {
  valid: boolean; errors: QuoteError[]; currency: string; lines: QuoteLine[];
  offerDiscount: number; couponDiscount: number; codFee: number; taxRate: number; taxInclusive: boolean;
  coupon: QuoteCoupon | null; appliedDiscounts: AppliedDiscount[];
  shippingMethod: { id: string; code: string; name: string; rate: number; minDays: number; maxDays: number } | null;
}
export interface ShippingMethod {
  id: string; code: string; name: string; description?: string; rate: number; freeAbove?: number;
  codAvailable: boolean; minDays: number; maxDays: number;
}

// ---------- Orders ----------
export interface Address {
  id?: string; label?: string; name: string; phone: string; line1: string; line2?: string; landmark?: string;
  city: string; state: string; postalCode: string; country: string; isDefault?: boolean;
}
export interface OrderItem {
  id: string; productId: string | null; variantId: string | null; sku: string; name: string; brand?: string;
  image: Media; variantTitle: string; options: OptionValue[];
  unitPrice: number; compareAt?: number; quantity: number; lineTotal: number;
  /** 0 = not returnable. */
  returnWindowDays: number;
}
export interface TrackingEvent { at: string; status: ShipmentStatus; location?: string; note?: string }
export interface OrderShipment {
  carrier: string; awb: string; status: ShipmentStatus; eta?: string; trackingUrl?: string; events: TrackingEvent[];
}
export interface Order {
  id: string; number: string; status: OrderStatus; paymentStatus: PaymentStatus; paymentProvider: PaymentProvider;
  email: string; phone: string; customerName: string; shippingAddress: Address; shippingMethodName?: string;
  items: OrderItem[]; totals: Omit<CartTotals, "offerNudges">;
  placedAt: string; deliveredAt?: string; cancelledAt?: string; trackingToken?: string;
  shipment?: OrderShipment;
  history?: { status: OrderStatus; at: string; note?: string }[];
}
export interface OrderSummary {
  id: string; number: string; status: OrderStatus; paymentStatus: PaymentStatus; total: number;
  itemCount: number; placedAt: string; image?: Media;
}
/** Public tracking view (get_order_tracking): no email/phone/street. */
export interface OrderTracking {
  number: string; status: OrderStatus; paymentStatus: PaymentStatus; placedAt: string; deliveredAt?: string;
  shipTo: { name: string; city: string; state: string; postalCode: string };
  items: { name: string; variantTitle: string; options: OptionValue[]; quantity: number; image?: Media }[];
  shipment?: OrderShipment;
  history: { status: OrderStatus; at: string }[];
}
export interface PaymentOption {
  provider: PaymentProvider; displayName: string; description?: string;
  supportedMethods: string[]; minAmount?: number; maxAmount?: number;
}
// ---------- GST invoice (invoices.snapshot, frozen at issue; money in paise) ----------
export interface InvoiceParty {
  name: string; lines: string[]; state?: string; stateCode?: string; gstin?: string; email?: string; phone?: string;
}
export interface InvoiceLine {
  kind: "item" | "shipping" | "cod_fee"; description: string; detail?: string; hsn?: string;
  quantity: number; unitPrice: number; discount: number; taxable: number; cgst: number; sgst: number; igst: number; total: number;
}
export interface InvoiceTotals {
  discount: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number; roundOff: number; total: number;
}
export interface Invoice {
  number: string; issuedAt: string; orderNumber: string; orderDate: string; currency: string;
  seller: InvoiceParty & { storeName: string; logoUrl?: string; supportEmail?: string; supportPhone?: string };
  billTo: InvoiceParty; shipTo: InvoiceParty;
  placeOfSupply: { state: string; code?: string };
  interState: boolean; taxRate: number; taxInclusive: boolean;
  lines: InvoiceLine[]; totals: InvoiceTotals; amountInWords: string;
  payment: { provider: PaymentProvider; status: "paid" | "cod" | "none"; method?: string; reference?: string; paidAt?: string };
}
export interface ReturnRequest {
  id: string; rmaNumber: string; orderId: string; status: ReturnStatus; reason: ReturnReason;
  customerNote?: string; refundAmount?: number; createdAt: string;
}

// ---------- Reviews ----------
export interface Review {
  id: string; productId: string; author: string; authorLocation?: string; rating: number; title: string; body: string;
  verifiedPurchase: boolean; status: ReviewStatus; helpfulCount: number; createdAt: string; images?: Media[];
}
export interface RatingSummary { average: number; count: number; histogram: Record<1 | 2 | 3 | 4 | 5, number> }

// ---------- Content ----------
export interface Testimonial { id: string; author: string; role?: string; quote: string; avatar?: Media; rating?: number }
export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string; cover?: Media; body: string;
  author: string; publishedAt: string; readingMinutes?: number; category?: { name: string; slug: string };
  tags: string[]; seo?: Seo;
}
export interface Faq { id: string; category: string; question: string; answer: string }
export interface ContentPage { id: string; slug: string; pageType: string; title: string; blocks: unknown; seo?: Seo }
export interface StoreSettings {
  storeName: string; currency: string; locale: string; supportEmail?: string; supportPhone?: string;
  freeShippingThreshold?: number; flatShippingFee: number; codEnabled: boolean; codFee: number;
  codMaxOrderAmount?: number; returnWindowDays: number; taxPercentage: number; taxInclusive: boolean;
  /** Brand assets (0024). logoDarkUrl is the light variant for dark stages. */
  logoUrl?: string; logoDarkUrl?: string; faviconUrl?: string;
}
export interface NavLink { label: string; href: string; children?: NavLink[] }

// ---------- Home sections (home_sections.config, see SCHEMA.md) ----------
interface HomeSectionBase { id: string; title?: string; subtitle?: string; sortOrder: number }
export interface HeroSlide {
  image: string; imageAlt: string; mobileImage?: string; eyebrow?: string; heading: string; body?: string;
  cta?: Cta; secondaryCta?: Cta; theme?: "light" | "dark";
}
export type ProductCarouselSource = "collection" | "category" | "featured" | "new" | "best_rated" | "manual";
export type HomeSection = HomeSectionBase & (
  | { type: "hero_carousel"; config: { autoplayMs?: number; slides: HeroSlide[] } }
  | { type: "category_grid"; config: { categoryIds?: string[]; limit?: number }; categories: Category[] }
  | { type: "collection_rail"; config: { collectionIds?: string[]; limit?: number }; collections: Collection[] }
  | {
      type: "product_carousel";
      config: { source: ProductCarouselSource; collectionId?: string; categoryId?: string; productIds?: string[]; limit?: number; cta?: Cta };
      products: Product[];
    }
  | { type: "floating_showcase"; config: { productIds: string[]; image?: string; imageAlt?: string; cta?: Cta }; products: Product[] }
  | { type: "promo_banner"; config: { image: string; imageAlt: string; heading: string; body?: string; couponCode?: string; cta?: Cta; theme?: "light" | "dark" } }
  | { type: "testimonials"; config: { limit?: number; testimonialIds?: string[] }; testimonials: Testimonial[] }
  | { type: "blog_rail"; config: { limit?: number; categorySlug?: string }; posts: BlogPost[] }
  | { type: "newsletter"; config: { heading: string; body?: string; placeholder?: string; buttonLabel?: string; consentText?: string } }
  | { type: "tear_reveal"; config: { word: string; tagline?: string; variant?: "tiger" | "image"; image?: string; imageAlt?: string; cta?: Cta } }
);
export type HomeSectionOf<T extends HomeSectionType> = Extract<HomeSection, { type: T }>;
