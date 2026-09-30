/**
 * RBAC single source for the app. MUST match public.role_permissions
 * (supabase/migrations/0002_identity_rbac.sql). Keep the two identical.
 * The DB re-checks every permission via has_permission() in RLS;
 * this map is for UI gating (nav items, buttons) and API guards.
 */
import type { UserRole } from "@/types/domain";

export const PERMISSIONS = [
  "catalog.read", "catalog.write", "catalog.publish",
  "inventory.read", "inventory.write",
  "orders.read", "orders.write", "orders.refund", "shipments.write",
  "returns.read", "returns.write",
  "customers.read", "customers.write", "journey.read",
  "payments.read", "payments.gateway.manage",
  "marketing.read", "coupons.write", "offers.write", "campaigns.write",
  "testimonials.write", "content.write", "seo.write", "blog.write", "blog.publish", "reviews.moderate",
  "analytics.read", "tryon.read",
  "support.read", "support.write",
  "settings.read", "settings.write", "settings.tax.manage", "settings.shipping.manage", "integrations.manage",
  "staff.manage", "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: [],
  super_admin: PERMISSIONS,
  catalog_manager: [
    "catalog.read", "catalog.write", "catalog.publish", "inventory.read", "inventory.write",
    "reviews.moderate", "tryon.read", "seo.write",
  ],
  order_manager: [
    "catalog.read", "inventory.read", "orders.read", "orders.write", "orders.refund",
    "shipments.write", "returns.read", "returns.write", "customers.read", "journey.read",
    "payments.read", "support.read", "settings.read", "settings.shipping.manage",
  ],
  marketing_manager: [
    "catalog.read", "marketing.read", "coupons.write", "offers.write", "campaigns.write",
    "testimonials.write", "content.write", "seo.write", "blog.write", "blog.publish",
    "reviews.moderate", "analytics.read",
  ],
  analyst: ["catalog.read", "marketing.read", "analytics.read", "tryon.read", "orders.read"],
  support_agent: [
    "catalog.read", "orders.read", "customers.read", "journey.read", "payments.read",
    "returns.read", "returns.write", "support.read", "support.write",
  ],
};

export const isStaffRole = (role: UserRole | null | undefined): boolean => !!role && role !== "customer";

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
