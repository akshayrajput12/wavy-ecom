/**
 * Shared domain contract: UI, const data, backend services and the SQL schema all agree on these.
 * Money is ALWAYS integer paise (₹1 = 100). Ids are uuid strings. Timestamps are ISO strings.
 * Enum values here mirror the Postgres enums in supabase/migrations exactly.
 */

// ---------- Enums (SRS §2) ----------
export const PRODUCT_STATUS = ["draft", "published", "unpublished", "archived"] as const;
export const VARIANT_STATUS = ["active", "out_of_stock", "disabled"] as const;
export const ORDER_STATUS = [
  "pending_payment", "paid", "processing", "packed", "shipped", "delivered",
  "cancelled", "return_requested", "returned", "refunded",
] as const;
export const PAYMENT_STATUS = ["initiated", "authorized", "captured", "failed", "refunded", "partially_refunded"] as const;
export const SHIPMENT_STATUS = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception", "cancelled"] as const;
export const RETURN_STATUS = ["requested", "approved", "rejected", "pickup_scheduled", "received", "refunded", "closed"] as const;
export const REVIEW_STATUS = ["pending", "approved", "rejected", "hidden"] as const;
export const COUPON_STATUS = ["draft", "active", "paused", "expired", "archived"] as const;
export const CAMPAIGN_STATUS = ["draft", "scheduled", "live", "paused", "completed", "archived"] as const;
export const INTEGRATION_STATUS = ["connected", "needs_attention", "disconnected"] as const;
export const TRYON_STATUS = ["created", "uploading", "queued", "processing", "completed", "failed", "expired", "deleted"] as const;
export const USER_ROLE = [
  "customer", "super_admin", "catalog_manager", "order_manager", "marketing_manager", "analyst", "support_agent",
] as const;
export const PAYMENT_PROVIDER = ["razorpay", "payu", "cod"] as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export type VariantStatus = (typeof VARIANT_STATUS)[number];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUS)[number];
export type ReturnStatus = (typeof RETURN_STATUS)[number];
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
export type CouponStatus = (typeof COUPON_STATUS)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];
export type IntegrationStatus = (typeof INTEGRATION_STATUS)[number];
export type TryOnStatus = (typeof TRYON_STATUS)[number];
export type UserRole = (typeof USER_ROLE)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDER)[number];

// ---------- Catalog ----------
export interface Media { url: string; alt: string; width?: number; height?: number }
export interface Seo { title?: string; description?: string; ogImage?: string; canonical?: string; noindex?: boolean }

export interface Category {
  id: string; name: string; slug: string; parentId: string | null;
  description?: string; image?: Media; sortOrder: number; seo?: Seo;
}
export interface Collection {
  id: string; name: string; slug: string; description?: string; image?: Media; seo?: Seo;
}
export interface ProductVariant {
  id: string; productId: string; sku: string; color: string; colorHex?: string; size: string;
  price: number; compareAt?: number; stock: number; status: VariantStatus; image?: Media;
}
export interface Product {
  id: string; name: string; slug: string; descriptor: string; description: string;
  categoryId: string; collectionIds: string[]; material?: string; fit?: string; care?: string;
  images: Media[]; badges: string[]; status: ProductStatus; seo?: Seo;
  rating: number; reviewCount: number; tryOnEnabled: boolean;
  priceFrom: number; compareAtFrom?: number;
  variants: ProductVariant[];
}

// ---------- Cart / checkout ----------
export interface CartLine {
  id: string; variantId: string; productId: string; name: string; image: Media;
  color: string; size: string; unitPrice: number; quantity: number; maxQuantity: number;
}
/** Server-authoritative totals (paise). */
export interface CartTotals {
  subtotal: number; discount: number; shipping: number; tax: number; total: number;
  appliedCoupon?: string;
  /** e.g. "Add 1 more item to get 3 for ₹999" — from bundle offers */
  offerNudges: { offerId: string; message: string; itemsNeeded: number }[];
}

// ---------- Orders ----------
export interface Address {
  id?: string; name: string; phone: string; line1: string; line2?: string;
  city: string; state: string; postalCode: string; country: string; isDefault?: boolean;
}
export interface OrderItem {
  id: string; productId: string; variantId: string; name: string; image: Media;
  color: string; size: string; unitPrice: number; quantity: number;
}
export interface TrackingEvent { at: string; status: ShipmentStatus; location?: string; note?: string }
export interface Order {
  id: string; number: string; status: OrderStatus; paymentStatus: PaymentStatus;
  email: string; phone: string; shippingAddress: Address;
  items: OrderItem[]; totals: Omit<CartTotals, "offerNudges">;
  placedAt: string; trackingUrl?: string; trackingToken?: string;
  shipment?: { carrier: string; awb: string; status: ShipmentStatus; eta?: string; events: TrackingEvent[] };
}

// ---------- Content ----------
export interface Review {
  id: string; productId: string; author: string; rating: number; title: string; body: string;
  verifiedPurchase: boolean; status: ReviewStatus; createdAt: string; images?: Media[];
}
export interface Testimonial { id: string; author: string; role?: string; quote: string; avatar?: Media }
export interface BlogPost {
  id: string; slug: string; title: string; excerpt: string; cover: Media; body: string;
  author: string; publishedAt: string; tags: string[]; seo?: Seo;
}
