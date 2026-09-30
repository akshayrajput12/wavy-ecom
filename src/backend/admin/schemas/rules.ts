/** Pure catalog rules shared by the zod schemas and the services (no server imports: testable, client-safe). */
import type { OrderStatus } from "@/types/domain";

export const SKU_RE = /^[A-Z0-9][A-Z0-9-]{2,63}$/;
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface VariantLike { sku: string; options: string[]; price: number; compareAtPrice?: number | null; disabled?: boolean }

/** What the storefront shows as "from" price: cheapest non-disabled variant (mirrors products.price_min trigger). */
export function computePriceFrom(variants: readonly VariantLike[]): { priceFrom: number | null; compareAtFrom: number | null } {
  const live = variants.filter((v) => !v.disabled);
  if (!live.length) return { priceFrom: null, compareAtFrom: null };
  const compare = live.map((v) => v.compareAtPrice).filter((c): c is number => c != null);
  return { priceFrom: Math.min(...live.map((v) => v.price)), compareAtFrom: compare.length ? Math.min(...compare) : null };
}

/** Human-readable problems with a variant set; empty = valid. Mirrors the DB checks so errors come back per field. */
export function variantIssues(optionNames: readonly string[], variants: readonly VariantLike[]): { index: number; message: string }[] {
  const issues: { index: number; message: string }[] = [];
  const skus = new Map<string, number>();
  const combos = new Map<string, number>();
  if (optionNames.length === 0 && variants.length > 1) issues.push({ index: 1, message: "A product without options has exactly one variant" });
  if (new Set(optionNames.map((n) => n.toLowerCase())).size !== optionNames.length) issues.push({ index: -1, message: "Option names must be unique" });
  variants.forEach((v, i) => {
    const sku = v.sku.toUpperCase();
    if (!SKU_RE.test(sku)) issues.push({ index: i, message: `SKU "${v.sku}" must be 3-64 chars of A-Z, 0-9 and -` });
    if (skus.has(sku)) issues.push({ index: i, message: `SKU ${sku} is used twice` });
    skus.set(sku, i);
    if (v.options.length !== optionNames.length) {
      issues.push({ index: i, message: `Expected ${optionNames.length} option value(s) (${optionNames.join(", ") || "none"})` });
    }
    const key = v.options.map((o) => o.trim().toLowerCase()).join("\u0000");
    if (combos.has(key)) issues.push({ index: i, message: `Option combination "${v.options.join(" / ") || "Default"}" is duplicated` });
    combos.set(key, i);
    if (v.compareAtPrice != null && v.compareAtPrice <= v.price) issues.push({ index: i, message: "Compare-at price must be higher than price" });
  });
  return issues;
}

/** True when re-parenting would create a loop in the category tree. */
export function createsCycle(nodes: ReadonlyMap<string, string | null>, id: string, newParent: string | null): boolean {
  for (let p = newParent, hops = 0; p; p = nodes.get(p) ?? null, hops++) {
    if (p === id || hops > 50) return true;
  }
  return false;
}

/** Mirror of public.order_status_allowed (0015). The DB trigger is the authority; this feeds UI hints and early 422s. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "processing", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["packed", "shipped", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["return_requested", "refunded"],
  return_requested: ["returned", "delivered", "refunded"],
  returned: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};
