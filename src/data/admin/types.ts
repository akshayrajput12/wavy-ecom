/**
 * Admin-only view models. Shared entities (Product, Order, Review…) come from @/types/domain;
 * these extend them with operational context the admin console needs. Money = paise.
 */
import type {
  CampaignStatus, CouponStatus, IntegrationStatus, Order, PaymentProvider, PaymentStatus, UserRole,
} from "@/types/domain";

export type StaffRole = Exclude<UserRole, "customer">;

export interface Kpi { id: string; label: string; value: number; format: "money" | "number" | "percent"; delta: number; hint: string }
export interface SeriesPoint { date: string; revenue: number; orders: number; sessions: number }

/** Where in the payment flow an attempt stopped (SRS payment states). */
export type FailureStage = "gateway_init" | "customer_auth" | "bank_decline" | "verification" | "timeout" | "none";
export interface PaymentAttempt {
  id: string; at: string; provider: PaymentProvider; method: string; amount: number;
  status: PaymentStatus; stage: FailureStage; reference?: string; message?: string;
}
export interface OrderNote { id: string; at: string; author: string; body: string }
export interface OrderEvent { at: string; label: string; actor: string }
export interface AdminOrder extends Order {
  customerId: string; customerName: string; paymentAttempts: PaymentAttempt[];
  notes: OrderNote[]; timeline: OrderEvent[];
}

export interface JourneyEvent { at: string; type: "page_view" | "add_to_cart" | "checkout" | "tryon" | "search" | "payment"; label: string }
export interface Ticket { id: string; subject: string; status: "open" | "pending" | "resolved"; at: string }
export interface Customer {
  id: string; name: string; email: string; phone: string; city: string; joinedAt: string;
  orders: number; lifetimeValue: number; lastOrderAt?: string; tags: string[];
  journey: JourneyEvent[]; tickets: Ticket[];
}

export interface Coupon {
  id: string; code: string; type: "percent" | "flat" | "free_shipping"; value: number;
  minOrder: number; usage: number; usageLimit?: number; startsAt: string; endsAt: string;
  status: CouponStatus; restriction: string;
}
export type Offer =
  | { id: string; kind: "bundle"; name: string; status: CouponStatus; quantity: number; collectionId: string; price: number }
  | { id: string; kind: "bogo"; name: string; status: CouponStatus; buy: number; get: number; collectionId: string }
  | { id: string; kind: "tiered"; name: string; status: CouponStatus; tiers: { minSubtotal: number; percentOff: number }[] };

export interface Campaign {
  id: string; name: string; channel: "email" | "sms" | "whatsapp" | "push" | "onsite";
  status: CampaignStatus; audience: string; scheduledFor?: string;
  sent: number; opened: number; clicked: number; revenue: number;
}

export interface Gateway {
  id: PaymentProvider; name: string; enabled: boolean; mode: "test" | "live"; isDefault: boolean;
  methods: string[]; successRate24h: number; attempts24h: number;
  failures: Record<Exclude<FailureStage, "none">, number>;
}
export interface Integration {
  id: string; name: string; purpose: string; status: IntegrationStatus; environment: "test" | "live";
  lastCheckedAt: string; fields: { key: string; label: string; value: string }[];
}
export interface ShippingSettings {
  provider: string; pickupAddress: string; pickupPincode: string; freeShippingThreshold: number;
  flatRate: number; codEnabled: boolean; codFee: number; codMaxOrder: number;
  windows: { zone: string; days: string }[]; returnsCourier: string; returnWindowDays: number;
}
export interface TaxSettings { gstPercent: number; inclusive: boolean; gstin: string; legalName: string; hsnDefault: string; stateCode: string }
export interface StoreSettings { name: string; supportEmail: string; supportPhone: string; address: string; currency: string; locale: string; timezone: string; lowStockThreshold: number }

export interface SeoOverride { id: string; route: string; title: string; description: string; noindex: boolean }
export interface Redirect { id: string; from: string; to: string; code: 301 | 302 }
export interface SeoSettings { sitemapEnabled: boolean; sitemapIncludes: string[]; robotsTxt: string }

export interface AdminBlogPost {
  id: string; slug: string; title: string; excerpt: string; body: string; author: string;
  status: "draft" | "scheduled" | "published"; publishAt?: string; tags: string[];
  seo: { title: string; description: string };
}
export interface AdminTestimonial { id: string; author: string; role?: string; quote: string; status: "published" | "draft" | "hidden" }

export interface StaffMember { id: string; name: string; email: string; role: StaffRole; status: "active" | "invited" | "suspended"; lastActiveAt?: string }
export interface AuditEntry { id: string; at: string; actor: string; action: string; entity: string; entityId: string; detail: string }

export interface TryOnMetrics {
  kpis: Kpi[];
  daily: { date: string; generations: number; completed: number }[];
  funnel: { step: string; count: number }[];
  providers: { name: string; generations: number; costPaise: number; avgSeconds: number; failureRate: number }[];
  assetTtlHours: number; purgedLast24h: number;
}
export interface Alert { id: string; tone: "warning" | "danger" | "info"; title: string; body: string; href: string }
