import type { LucideIcon } from "lucide-react";
import {
  Boxes, ChartLine, CircleHelp, CreditCard, FileText, FolderTree, Gift, Globe, History, House, Layers, LayoutGrid, Megaphone, MessageSquareText, Newspaper, Plug, Quote, Receipt, Settings, Shirt, ShoppingBag, TicketPercent, Truck, Undo2, UserCog, Users,
} from "lucide-react";
import { can as canPermission, type Permission } from "@/backend/_core/permissions";
import type { StaffRole } from "@/types/admin";

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
  ] },
  { label: "Catalog", items: [
    { label: "Products", href: "/admin/products", permission: "catalog.read", icon: Shirt },
    { label: "Categories", href: "/admin/categories", permission: "catalog.read", icon: FolderTree },
    { label: "Collections", href: "/admin/collections", permission: "catalog.read", icon: Layers },
    { label: "Inventory", href: "/admin/inventory", permission: "inventory.read", icon: Boxes },
  ] },
  { label: "Sales", items: [
    { label: "Orders", href: "/admin/orders", permission: "orders.read", icon: ShoppingBag },
    { label: "Payments", href: "/admin/payments", permission: "payments.read", icon: CreditCard },
    { label: "Returns", href: "/admin/returns", permission: "returns.read", icon: Undo2 },
    { label: "Customers", href: "/admin/customers", permission: "customers.read", icon: Users },
  ] },
  { label: "Marketing", items: [
    { label: "Coupons", href: "/admin/coupons", permission: "marketing.read", icon: TicketPercent },
    { label: "Offers", href: "/admin/offers", permission: "marketing.read", icon: Gift },
    { label: "Campaigns", href: "/admin/campaigns", permission: "marketing.read", icon: Megaphone },
    { label: "Reviews", href: "/admin/reviews", permission: "reviews.moderate", icon: MessageSquareText },
    { label: "Testimonials", href: "/admin/testimonials", permission: "testimonials.write", icon: Quote },
  ] },
  { label: "Content", items: [
    { label: "Home page", href: "/admin/home", permission: "content.write", icon: House },
    { label: "Blog", href: "/admin/blog", permission: "blog.write", icon: Newspaper },
    { label: "FAQs", href: "/admin/faqs", permission: "content.write", icon: CircleHelp },
    { label: "Pages", href: "/admin/pages", permission: "content.write", icon: FileText },
    { label: "SEO", href: "/admin/seo", permission: "seo.write", icon: Globe },
  ] },
  { label: "Settings", items: [
    { label: "Store", href: "/admin/settings", permission: "settings.read", icon: Settings },
    { label: "Shipping", href: "/admin/shipping", permission: "settings.shipping.manage", icon: Truck },
    { label: "Tax", href: "/admin/tax", permission: "settings.tax.manage", icon: Receipt },
    { label: "Staff", href: "/admin/staff", permission: "staff.manage", icon: UserCog },
    { label: "Integrations", href: "/admin/integrations", permission: "integrations.manage", icon: Plug },
    { label: "Audit log", href: "/admin/audit-log", permission: "audit.read", icon: History },
  ] },
];

const ALL_ITEMS = ADMIN_NAV.flatMap((g) => g.items);

/** Nav item owning a pathname (longest prefix), used for breadcrumb + route guard. */
export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
