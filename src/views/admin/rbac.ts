import type { LucideIcon } from "lucide-react";
import {
  Boxes, ChartLine, CreditCard, FolderTree, Gift, Globe, History, LayoutGrid, Megaphone, MessageSquareText, Newspaper, Plug, Quote, Receipt, ScanFace, Settings, Shirt, ShoppingBag, TicketPercent, Truck, UserCog, Users,
} from "lucide-react";
import { can as canPermission, type Permission } from "@/backend/_core/permissions";
import type { StaffRole } from "@/data/admin/types";

/**
 * Admin RBAC for the UI (nav filtering + "No access" states + disabled actions).
 * Source of truth is src/backend/_core/permissions.ts (mirrors public.role_permissions); the server re-checks every action.
 */
export type { Permission };

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super admin", catalog_manager: "Catalog manager", order_manager: "Order manager",
  marketing_manager: "Marketing / content", analyst: "Analyst (read-only)", support_agent: "Support agent",
};

/** `null` permission = any staff member. */
export const can = (role: StaffRole, p: Permission | null) => p === null || canPermission(role, p);

export interface NavItem { label: string; href: string; permission: Permission | null; icon: LucideIcon }
export interface NavGroup { label: string; items: NavItem[] }

export const ADMIN_NAV: NavGroup[] = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/admin/dashboard", permission: null, icon: LayoutGrid },
    { label: "Analytics", href: "/admin/analytics", permission: "analytics.read", icon: ChartLine },
    { label: "Try-on analytics", href: "/admin/tryon-analytics", permission: "tryon.read", icon: ScanFace },
  ] },
  { label: "Catalog", items: [
    { label: "Products", href: "/admin/products", permission: "catalog.read", icon: Shirt },
    { label: "Categories", href: "/admin/categories", permission: "catalog.write", icon: FolderTree },
    { label: "Inventory", href: "/admin/inventory", permission: "inventory.read", icon: Boxes },
  ] },
  { label: "Fulfilment", items: [
    { label: "Orders", href: "/admin/orders", permission: "orders.read", icon: ShoppingBag },
    { label: "Customers", href: "/admin/customers", permission: "customers.read", icon: Users },
    { label: "Shipping", href: "/admin/shipping", permission: "settings.shipping.manage", icon: Truck },
  ] },
  { label: "Content & marketing", items: [
    { label: "Reviews", href: "/admin/reviews", permission: "reviews.moderate", icon: MessageSquareText },
    { label: "Testimonials", href: "/admin/testimonials", permission: "testimonials.write", icon: Quote },
    { label: "Coupons", href: "/admin/coupons", permission: "coupons.write", icon: TicketPercent },
    { label: "Offers", href: "/admin/offers", permission: "offers.write", icon: Gift },
    { label: "Campaigns", href: "/admin/campaigns", permission: "campaigns.write", icon: Megaphone },
    { label: "Journal", href: "/admin/blog", permission: "blog.write", icon: Newspaper },
    { label: "SEO", href: "/admin/seo", permission: "seo.write", icon: Globe },
  ] },
  { label: "System", items: [
    { label: "Payments", href: "/admin/payments", permission: "payments.read", icon: CreditCard },
    { label: "Tax", href: "/admin/tax", permission: "settings.tax.manage", icon: Receipt },
    { label: "Integrations", href: "/admin/integrations", permission: "integrations.manage", icon: Plug },
    { label: "Staff", href: "/admin/staff", permission: "staff.manage", icon: UserCog },
    { label: "Audit log", href: "/admin/audit-log", permission: "audit.read", icon: History },
    { label: "Settings", href: "/admin/settings", permission: "settings.write", icon: Settings },
  ] },
];

const ALL_ITEMS = ADMIN_NAV.flatMap((g) => g.items);

/** Nav item owning a pathname (longest prefix), used for breadcrumb + route guard. */
export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
