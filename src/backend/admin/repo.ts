import "server-only";
import { hasSupabase } from "@/lib/env";
import * as data from "@/data/admin";

/**
 * Admin data access. Without Supabase every getter returns const data from src/data/admin.
 * TODO(backend agent): replace each `if (hasSupabase)` block with the real query (RLS + staff role check).
 */
async function fallback<T>(value: T): Promise<T> {
  if (hasSupabase) { /* TODO(backend agent) */ }
  return value;
}

export const getDashboard = () => fallback({
  kpis: data.dashboardKpis, series: data.salesSeries, alerts: data.dashboardAlerts, shortcuts: data.dashboardShortcuts,
  recentOrders: data.adminOrders.slice(0, 6),
  lowStock: data.adminProducts.flatMap((p) => p.variants.filter((v) => v.stock <= data.storeSettings.lowStockThreshold).map((v) => ({ ...v, productName: p.name }))).slice(0, 6),
});

export const getProducts = () => fallback(data.adminProducts);
export const getProduct = (id: string) => fallback(data.adminProducts.find((p) => p.id === id) ?? null);
export const getCategories = () => fallback(data.adminCategories);
export const getCollections = () => fallback(data.adminCollections);
export const getInventoryReasons = () => fallback(data.inventoryReasons);

export const getOrders = () => fallback(data.adminOrders);
export const getOrder = (number: string) => fallback(data.adminOrders.find((o) => o.number === number) ?? null);
export const getCustomers = () => fallback(data.adminCustomers);
export const getCustomer = async (id: string) => {
  const customer = await fallback(data.adminCustomers.find((c) => c.id === id) ?? null);
  return customer && { customer, orders: data.adminOrders.filter((o) => o.customerId === id) };
};

export const getReviews = () => fallback(data.adminReviews);
export const getTestimonials = () => fallback(data.adminTestimonials);
export const getCoupons = () => fallback(data.adminCoupons);
export const getOffers = () => fallback(data.adminOffers);
export const getCampaigns = () => fallback(data.adminCampaigns);
export const getBlogPosts = () => fallback(data.adminBlogPosts);
export const getBlogPost = (id: string) => fallback(data.adminBlogPosts.find((p) => p.id === id) ?? null);

export const getAnalytics = () => fallback({ series: data.salesSeries, categories: data.categoryBreakdown, funnel: data.conversionFunnel, ranges: data.dateRanges });
export const getTryOnMetrics = () => fallback(data.tryOnMetrics);

export const getShipping = () => fallback(data.shippingSettings);
export const getGateways = () => fallback(data.gateways);
export const getTax = () => fallback(data.taxSettings);
export const getIntegrations = () => fallback(data.integrations);
export const getSeo = () => fallback({ overrides: data.seoOverrides, redirects: data.redirects, settings: data.seoSettings });
export const getStaff = () => fallback(data.staff);
export const getAuditLog = () => fallback(data.auditLog);
export const getStoreSettings = () => fallback(data.storeSettings);
/** TODO(backend agent): resolve from the authenticated staff session. */
export const getCurrentStaff = () => fallback(data.staff[0]);
