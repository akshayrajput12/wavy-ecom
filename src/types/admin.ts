/**
 * Admin console contract (docs/api/ADMIN_API.md). Rows are the Supabase tables with camelCase keys
 * (`CamelRow<Tables<"coupons">>`): nulls stay null, money is integer paise, timestamps ISO strings.
 * Input shapes are the zod schemas in src/backend/admin/schemas/* (client-safe, reuse them in forms).
 */
import type { Database, Tables } from "./database";
import type { OrderStatus, Paginated, ProductSpecification, UserRole } from "./domain";

export type { Paginated };
export type Camel<S extends string> = S extends `${infer H}_${infer T}` ? `${H}${Capitalize<Camel<T>>}` : S;
export type CamelRow<T> = { [K in keyof T as K extends string ? Camel<K> : never]: T[K] };
type Row<T extends keyof Database["public"]["Tables"]> = CamelRow<Tables<T>>;
export type Enum<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type StaffRole = Exclude<UserRole, "customer">;
export interface StaffSession { userId: string; email: string | null; name: string | null; role: StaffRole }

// ---------- Catalog ----------
export type AdminCategory = Row<"categories"> & { productCount: number; children: AdminCategory[] };
export type AdminCollection = Row<"collections"> & { productCount: number };
export interface AdminCollectionProduct {
  productId: string; name: string; slug: string; status: Enum<"product_status">; image: string | null; position: number;
}
export type AdminCollectionDetail = AdminCollection & { products: AdminCollectionProduct[] };

export interface AdminProductRow {
  id: string; slug: string; name: string; brand: string | null; status: Enum<"product_status">;
  categoryId: string; categoryName: string | null; image: string | null;
  priceMin: number | null; priceMax: number | null; variantCount: number;
  available: number; lowStock: boolean; outOfStock: boolean; isFeatured: boolean; updatedAt: string;
}
/** `options` = option1..3 values in `optionNames` order. */
export type AdminVariant = Omit<Row<"product_variants">, "option1" | "option2" | "option3"> & {
  options: string[]; onHand: number; reserved: number; available: number;
};
export type AdminMedia = Row<"product_media">;
export type AdminProduct = Omit<Row<"products">, "searchVector" | "specifications" | "sizeChart"> & {
  specifications: ProductSpecification[]; sizeChart: Record<string, unknown> | null;
  categoryName: string | null; collectionIds: string[]; variants: AdminVariant[]; media: AdminMedia[];
};

export interface AdminInventoryRow {
  variantId: string; productId: string; productName: string; productSlug: string; productStatus: Enum<"product_status">;
  sku: string; title: string; status: Enum<"variant_status">;
  onHand: number; reserved: number; available: number; threshold: number; low: boolean;
}
export type AdminMovement = Row<"inventory_movements"> & { actorEmail: string | null };

// ---------- Orders / payments ----------
export interface AdminOrderRow {
  id: string; orderNumber: string; status: OrderStatus; paymentStatus: Enum<"payment_status">;
  paymentProvider: Enum<"payment_provider">; customerName: string; email: string; phone: string;
  total: number; itemCount: number; placedAt: string;
}
export interface AdminOrderNote { id: number; at: string; author: string | null; body: string }
export type AdminShipment = Row<"shipments"> & { items: Row<"shipment_items">[]; events: Row<"shipment_events">[] };
export type AdminReturn = Row<"return_requests"> & { items: Row<"return_items">[]; orderNumber?: string };
export type AdminOrderDetail = Row<"orders"> & {
  items: Row<"order_items">[]; payments: Row<"payments">[]; attempts: Row<"payment_attempts">[];
  events: Row<"payment_events">[]; refunds: Row<"refunds">[]; shipments: AdminShipment[];
  history: Row<"order_status_history">[]; staffNotes: AdminOrderNote[]; returns: AdminReturn[];
  /** Captured minus non-failed refunds of the order's own payment (paise). */
  refundable: number;
  /** Statuses PATCH /orders/:number accepts next (mirror of order_status_allowed). */
  allowedTransitions: OrderStatus[];
};
export type AdminPayment = Row<"payments"> & { orderNumber: string | null };
export type AdminPaymentAttempt = Row<"payment_attempts"> & { orderNumber: string | null };
export type AdminPaymentEvent = Row<"payment_events"> & { orderNumber: string | null };
export type AdminGateway = Row<"payment_gateways"> & {
  stats24h: { attempts: number; captured: number; failed: number; successRate: number; failuresByStage: Record<string, number> };
};

// ---------- Marketing ----------
export interface DiscountTarget { mode: Enum<"target_mode">; kind: "product" | "variant" | "category" | "collection"; id: string }
export interface RedemptionStats { applied: number; reserved: number; reversed: number; discountGiven: number }
export type AdminCoupon = Row<"coupons"> & { targets: DiscountTarget[]; stats: RedemptionStats };
/** tiers are camelCase here (stored as [{min_qty, percent}]). */
export type AdminOffer = Omit<Row<"offers">, "tiers"> & {
  tiers: { minQty: number; percent: number }[] | null; targets: DiscountTarget[]; stats: RedemptionStats;
};
export type AdminCampaign = Row<"campaigns">;
export type AdminReview = Row<"reviews"> & { productName: string | null; productSlug: string | null };

// ---------- Content ----------
export type AdminHomeSection = Row<"home_sections">;
export type AdminBlogPost = Omit<Row<"blog_posts">, "searchVector"> & { tags: string[]; categoryName: string | null };
export type AdminBlogCategory = Row<"blog_categories">;
export type AdminFaq = Row<"faqs">;
export type AdminTestimonial = Row<"testimonials">;
export type AdminContentPage = Row<"content_pages">;
export type AdminSeoOverride = Row<"seo_overrides">;
export type AdminRedirect = Row<"redirects">;

// ---------- Customers / staff ----------
export interface AdminCustomerRow {
  id: string; email: string | null; fullName: string | null; phone: string | null; status: Enum<"account_status">;
  role: UserRole; createdAt: string; lastSeenAt: string | null; orders: number; lifetimeValue: number; lastOrderAt: string | null;
}
export interface JourneyEntry { occurredAt: string; kind: string; summary: string; refId: string | null; detail: unknown }
export interface AdminCustomerDetail {
  customer: AdminCustomerRow; addresses: Row<"addresses">[]; orders: AdminOrderRow[];
  /** null when the viewer lacks journey.read. */
  journey: JourneyEntry[] | null; tickets: Row<"support_tickets">[];
}
export type AdminStaff = Row<"staff_members"> & { lastSeenAt: string | null };

// ---------- Settings ----------
export type AdminStoreSettings = Row<"store_settings">;
export type AdminShippingMethod = Row<"shipping_methods">;
export type AdminShippingZone = Row<"shipping_zones"> & { methods: AdminShippingMethod[] };
export type AdminIntegration = Row<"integration_configs">;
export type AdminAuditEntry = Row<"audit_logs">;

// ---------- Dashboard / analytics ----------
export interface Kpi { id: string; label: string; value: number; previous?: number; format: "money" | "number" | "percent" }
export interface AdminDashboard { kpis: Kpi[]; recentOrders: AdminOrderRow[]; lowStock: AdminInventoryRow[] }
export interface AdminAnalytics {
  range: { from: string; to: string };
  totals: { revenue: number; orders: number; aov: number; refunded: number; sessions: number };
  series: { date: string; revenue: number; orders: number }[];
  byStatus: Partial<Record<OrderStatus, number>>;
  byProvider: { provider: Enum<"payment_provider">; captured: number; payments: number; failedAttempts: number }[];
  topProducts: { productId: string | null; name: string; quantity: number; revenue: number }[];
  funnel: { step: Enum<"analytics_event_name">; count: number }[];
}
