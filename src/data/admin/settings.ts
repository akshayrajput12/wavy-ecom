import type {
  AuditEntry, Gateway, Integration, Redirect, SeoOverride, SeoSettings, ShippingSettings, StaffMember, StoreSettings, TaxSettings,
} from "./types";

export const shippingSettings: ShippingSettings = {
  provider: "Shiprocket", pickupAddress: "Unit 4, Bhiwandi Logistics Park, Thane", pickupPincode: "421302",
  freeShippingThreshold: 149900, flatRate: 9900, codEnabled: true, codFee: 4900, codMaxOrder: 1000000,
  windows: [
    { zone: "Metro (Mumbai, Delhi NCR, Bengaluru)", days: "1–3" },
    { zone: "Tier 2 cities", days: "3–5" },
    { zone: "North-East, J&K, islands", days: "5–9" },
  ],
  returnsCourier: "Shiprocket Returns (Delhivery reverse)", returnWindowDays: 7,
};

export const gateways: Gateway[] = [
  { id: "razorpay", name: "Razorpay", enabled: true, mode: "live", isDefault: true, methods: ["UPI", "Cards", "Netbanking", "Wallets", "EMI"], successRate24h: 87.4, attempts24h: 1284,
    failures: { gateway_init: 6, customer_auth: 71, bank_decline: 52, verification: 7, timeout: 26 } },
  { id: "payu", name: "PayU", enabled: true, mode: "test", isDefault: false, methods: ["UPI", "Cards", "Netbanking"], successRate24h: 81.2, attempts24h: 96,
    failures: { gateway_init: 2, customer_auth: 7, bank_decline: 5, verification: 1, timeout: 3 } },
  { id: "cod", name: "Cash on Delivery", enabled: true, mode: "live", isDefault: false, methods: ["Cash", "UPI on delivery"], successRate24h: 96.0, attempts24h: 142,
    failures: { gateway_init: 0, customer_auth: 0, bank_decline: 0, verification: 6, timeout: 0 } },
];

export const failureStageLabels = {
  gateway_init: "Gateway init", customer_auth: "Customer auth (OTP/UPI)", bank_decline: "Bank decline",
  verification: "Verification / callback", timeout: "Timeout", none: "Succeeded",
} as const;

export const taxSettings: TaxSettings = { gstPercent: 12, inclusive: true, gstin: "27ABCDE1234F1Z5", legalName: "wavy Apparel Pvt. Ltd.", hsnDefault: "6109", stateCode: "27" };

export const storeSettings: StoreSettings = {
  name: "wavy", supportEmail: "support@wavy.store", supportPhone: "+91 22 4000 1234",
  address: "3rd Floor, Kamala Mills, Lower Parel, Mumbai 400013", currency: "INR", locale: "en-IN", timezone: "Asia/Kolkata", lowStockThreshold: 5,
};

const checked = "2026-09-25T07:30:00+05:30";
export const integrations: Integration[] = [
  { id: "razorpay", name: "Razorpay", purpose: "Online payments, refunds", status: "connected", environment: "live", lastCheckedAt: checked, fields: [{ key: "keyId", label: "Key ID", value: "rzp_live_••••4Kq" }, { key: "webhook", label: "Webhook URL", value: "/api/webhooks/razorpay" }] },
  { id: "payu", name: "PayU", purpose: "Backup gateway", status: "needs_attention", environment: "test", lastCheckedAt: checked, fields: [{ key: "merchantKey", label: "Merchant key", value: "gtKF••••" }] },
  { id: "shiprocket", name: "Shiprocket", purpose: "Shipments, tracking, returns", status: "connected", environment: "live", lastCheckedAt: checked, fields: [{ key: "email", label: "API user", value: "ops@wavy.store" }, { key: "pickup", label: "Pickup location", value: "Bhiwandi-01" }] },
  { id: "resend", name: "Resend", purpose: "Transactional email", status: "connected", environment: "live", lastCheckedAt: checked, fields: [{ key: "from", label: "From address", value: "orders@wavy.store" }] },
  { id: "ga4", name: "Google Analytics 4", purpose: "Commerce analytics", status: "connected", environment: "live", lastCheckedAt: checked, fields: [{ key: "measurementId", label: "Measurement ID", value: "G-XXXX12AB" }] },
  { id: "posthog", name: "PostHog", purpose: "Product events & funnels", status: "disconnected", environment: "live", lastCheckedAt: checked, fields: [{ key: "host", label: "Host", value: "https://eu.posthog.com" }] },
  { id: "ai", name: "AI try-on provider", purpose: "Try-on generation", status: "connected", environment: "live", lastCheckedAt: checked, fields: [{ key: "model", label: "Model", value: "tryon-v1.6" }, { key: "region", label: "Region", value: "ap-south-1" }] },
];

export const seoOverrides: SeoOverride[] = [
  { id: "s1", route: "/", title: "wavy — Clothing & Sneakers, designed in India", description: "Heavyweight tees, hoodies and sneakers. Free shipping over ₹1,499.", noindex: false },
  { id: "s2", route: "/collections/sneakers", title: "Sneakers for men & women | wavy", description: "Leather low-tops and suede runners. Try on virtually before you buy.", noindex: false },
  { id: "s3", route: "/search", title: "Search | wavy", description: "", noindex: true },
];
export const redirects: Redirect[] = [
  { id: "rd1", from: "/shop/tees", to: "/collections/t-shirts", code: 301 },
  { id: "rd2", from: "/sale", to: "/collections/new-in", code: 302 },
];
export const seoSettings: SeoSettings = {
  sitemapEnabled: true, sitemapIncludes: ["Products", "Collections", "Journal", "Pages"],
  robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\nSitemap: https://wavy.store/sitemap.xml",
};

export const staff: StaffMember[] = [
  { id: "st1", name: "Kabir Sethi", email: "kabir@wavy.store", role: "super_admin", status: "active", lastActiveAt: "2026-09-25T08:30:00+05:30" },
  { id: "st2", name: "Neha Joshi", email: "neha@wavy.store", role: "catalog_manager", status: "active", lastActiveAt: "2026-09-25T07:10:00+05:30" },
  { id: "st3", name: "Rahul Verma", email: "rahul@wavy.store", role: "order_manager", status: "active", lastActiveAt: "2026-09-25T08:05:00+05:30" },
  { id: "st4", name: "Tara Bose", email: "tara@wavy.store", role: "marketing_manager", status: "active", lastActiveAt: "2026-09-24T18:40:00+05:30" },
  { id: "st5", name: "Arjun Rao", email: "arjun@wavy.store", role: "analyst", status: "invited" },
  { id: "st6", name: "Priya Das", email: "priya@wavy.store", role: "support_agent", status: "suspended", lastActiveAt: "2026-08-30T12:00:00+05:30" },
];

export const auditLog: AuditEntry[] = [
  { id: "au1", at: "2026-09-25T08:14:00+05:30", actor: "Rahul Verma", action: "order.mark_packed", entity: "order", entityId: "BB-10418", detail: "Status processing → packed" },
  { id: "au2", at: "2026-09-25T07:58:00+05:30", actor: "Kabir Sethi", action: "payments.gateway_toggle", entity: "gateway", entityId: "payu", detail: "Enabled PayU (test mode)" },
  { id: "au3", at: "2026-09-25T07:22:00+05:30", actor: "Neha Joshi", action: "inventory.adjust", entity: "variant", entityId: "DAYBREAK-HOODIE-BON-M", detail: "+12 · Received purchase order" },
  { id: "au4", at: "2026-09-24T19:02:00+05:30", actor: "Tara Bose", action: "coupon.create", entity: "coupon", entityId: "DIWALI20", detail: "20% off, min ₹2,499" },
  { id: "au5", at: "2026-09-24T17:45:00+05:30", actor: "Kabir Sethi", action: "staff.invite", entity: "staff", entityId: "arjun@wavy.store", detail: "Role: analyst" },
  { id: "au6", at: "2026-09-24T12:30:00+05:30", actor: "Rahul Verma", action: "order.refund", entity: "order", entityId: "BB-10414", detail: "Full refund ₹6,999 via Razorpay" },
  { id: "au7", at: "2026-09-23T10:05:00+05:30", actor: "Neha Joshi", action: "product.publish", entity: "product", entityId: "p-court-low", detail: "draft → published" },
];
