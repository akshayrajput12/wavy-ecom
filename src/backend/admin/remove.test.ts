import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffRole } from "@/types/admin";

type Row = Record<string, unknown>;
type Op = { op: "update" | "delete"; table: string; ids: unknown[]; values?: Row };

/** In-memory stand-in for the service client: select/update/delete filtered by `.in()`, plus storage.remove. */
const fake = vi.hoisted(() => {
  const state = { tables: {} as Record<string, Row[]>, ops: [] as Op[], removed: [] as { bucket: string; paths: string[] }[] };
  const from = (table: string) => {
    let op: "select" | Op["op"] = "select";
    let values: Row | undefined;
    const all = () => state.tables[table] ?? [];
    const b = {
      select: () => b,
      update: (v: Row) => { op = "update"; values = v; return b; },
      delete: () => { op = "delete"; return b; },
      in: async (col: string, ids: unknown[]) => {
        const rows = all().filter((r) => ids.includes(r[col]));
        if (op !== "select") state.ops.push({ op, table, ids, values });
        return { data: rows, error: null };
      },
      then: (resolve: (v: { data: Row[]; error: null }) => void) => resolve({ data: all(), error: null }),
    };
    return b;
  };
  const storage = { from: (bucket: string) => ({ remove: async (paths: string[]) => { state.removed.push({ bucket, paths }); return { error: null }; } }) };
  return { state, db: { from, storage } };
});

vi.mock("server-only", () => ({}));
vi.mock("./_shared", async () => {
  const { can } = await import("@/backend/_core/permissions");
  const { ApiError } = await import("@/backend/_core/http");
  return {
    db: () => fake.db,
    assertCan: (a: { role: StaffRole }, p: Parameters<typeof can>[1]) => { if (!can(a.role, p)) throw new ApiError(403, "forbidden", `Missing permission: ${p}`); },
    audit: vi.fn(), revalidate: vi.fn(), guard: vi.fn(),
    exec: (r: { error: unknown }) => { if (r.error) throw r.error; },
    must: (r: { data: unknown; error: unknown }) => { if (r.error) throw r.error; return r.data; },
    notFound: (what: string) => { throw new ApiError(404, "not_found", `${what} not found`); },
  };
});

const { bucketPath, removeMany, reparent } = await import("./remove");
const actor = (role: StaffRole) => ({ userId: "u1", email: "a@b.co", name: null, role });
const c = (n: number) => [{ count: n }];
const opsOn = (table: string) => fake.state.ops.filter((o) => o.table === table);

beforeEach(() => { fake.state.tables = {}; fake.state.ops = []; fake.state.removed = []; });

describe("removeMany permissions", () => {
  it("refuses a role without the resource's write permission before touching data", async () => {
    fake.state.tables.products = [{ id: "p1", order_items: c(0) }];
    await expect(removeMany(actor("marketing_manager"), "products", ["p1"])).rejects.toMatchObject({ status: 403 });
    await expect(removeMany(actor("catalog_manager"), "coupons", ["x"])).rejects.toMatchObject({ status: 403 });
    expect(fake.state.ops).toEqual([]);
  });

  it("404s when no id matched", async () => {
    await expect(removeMany(actor("super_admin"), "faqs", ["nope"])).rejects.toMatchObject({ status: 404 });
  });
});

describe("removeMany products", () => {
  it("archives products with orders or discount rules and hard-deletes the rest", async () => {
    fake.state.tables.products = [
      { id: "sold", order_items: c(3), discount_targets: c(0), product_variants: [] },
      { id: "free", order_items: c(0), discount_targets: c(0), product_variants: [{ discount_targets: c(0) }] },
      { id: "ruled", order_items: c(0), discount_targets: c(0), product_variants: [{ discount_targets: c(1) }] },
    ];
    fake.state.tables.product_media = [{ product_id: "free", storage_path: "a/free.webp" }, { product_id: "sold", storage_path: "a/sold.webp" }];
    const res = await removeMany(actor("catalog_manager"), "products", ["sold", "free", "ruled"]);
    expect(res).toEqual({ deleted: 1, archived: 2 });
    expect(opsOn("products")).toEqual([
      { op: "delete", table: "products", ids: ["free"], values: undefined },
      { op: "update", table: "products", ids: ["sold", "ruled"], values: { status: "archived" } },
    ]);
    expect(fake.state.removed).toEqual([{ bucket: "product-media", paths: ["a/free.webp"] }]);
  });
});

describe("removeMany other resources", () => {
  it("blocks categories that still have products, naming them", async () => {
    fake.state.tables.categories = [{ id: "k1", name: "Shirts", products: c(4), discount_targets: c(0) }];
    await expect(removeMany(actor("super_admin"), "categories", ["k1"])).rejects.toMatchObject({ status: 409, code: "category_in_use", message: expect.stringContaining("Shirts (4)") });
    expect(fake.state.ops).toEqual([]);
  });

  it("archives redeemed coupons and deletes unused ones", async () => {
    fake.state.tables.coupons = [{ id: "used", coupon_redemptions: c(1), orders: c(1) }, { id: "new", coupon_redemptions: c(0), orders: c(0) }];
    expect(await removeMany(actor("marketing_manager"), "coupons", ["used", "new"])).toEqual({ deleted: 1, archived: 1 });
  });

  it("switches off shipping methods used by orders", async () => {
    fake.state.tables.shipping_methods = [{ id: "m1", orders: c(2) }];
    expect(await removeMany(actor("order_manager"), "shipping-methods", ["m1"])).toEqual({ deleted: 0, archived: 1 });
    expect(opsOn("shipping_methods")).toEqual([{ op: "update", table: "shipping_methods", ids: ["m1"], values: { is_active: false } }]);
  });
});

describe("helpers", () => {
  it("reparents children to the nearest surviving ancestor", () => {
    const parents = new Map<string, string | null>([["root", null], ["a", "root"], ["b", "a"], ["c", "b"], ["d", "a"]]);
    expect(reparent(parents, new Set(["a", "b"]))).toEqual(new Map([["c", "root"], ["d", "root"]]));
    expect(reparent(parents, new Set(["root"]))).toEqual(new Map([["a", null]]));
  });

  it("maps only our own bucket URLs to storage paths", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    expect(bucketPath("https://x.supabase.co/storage/v1/object/public/category-media/2026-01/a%20b.webp?v=1", "category-media")).toBe("2026-01/a b.webp");
    expect(bucketPath("https://cdn.example.com/category-media/a.webp", "category-media")).toBeNull();
    expect(bucketPath(null, "category-media")).toBeNull();
  });
});
