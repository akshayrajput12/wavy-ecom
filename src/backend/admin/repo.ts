import "server-only";
/**
 * Getters for admin Server Components (contract: docs/api/ADMIN_API.md). Each one checks the viewer's permission
 * against the DB and throws ApiError 401/403 when missing; without Supabase they return empty (null / [] / empty page).
 */
export { listProducts, getProduct, listProductOptions } from "./products";
export { listCategoryTree, listCategoryOptions, getCategory } from "./categories";
export { listCollections, getCollection } from "./collections";
export { listInventory, listMovements } from "./inventory";
export { listOrders, getOrder } from "./orders";
export { listReturns } from "./fulfilment";
export { listPayments, listGateways } from "./payments";
export { listCoupons, getCoupon, listOffers, getOffer } from "./marketing";
export { listReviews } from "./reviews";
export { listBlogPosts, getBlogPost, listBlogCategories } from "./blog";
export {
  listFaqs, listTestimonials, listCampaigns, listContentPages, listHomeSections, listSeoOverrides, listRedirects, listShippingZones, getResource,
} from "./crud";
export { listCustomers, getCustomer, listStaff, getCurrentStaff } from "./customers";
export { getStoreSettings, listIntegrations, listAuditLog } from "./settings";
export { getDashboard, getAnalytics } from "./dashboard";
