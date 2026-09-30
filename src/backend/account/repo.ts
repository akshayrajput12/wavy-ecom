import "server-only";
import { getSession, type Session } from "@/backend/_core/auth";
import { must, userDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { getProductsByIds } from "@/backend/catalog/repo";
import { hasSupabase } from "@/lib/env";
import type { Address, Product } from "@/types/domain";
import type { AddressInput, ProfileInput, WishlistInput } from "./schema";

export interface AccountUser { id: string; name: string; email: string; phone: string; marketingOptIn: boolean; memberSince: string }

/** Signed-in customer's profile, or null (also null when Supabase is not configured). */
export async function getAccountUser(): Promise<AccountUser | null> {
  if (!hasSupabase) return null;
  const session = await getSession();
  if (!session) return null;
  const db = await userDb();
  const p = must<{ id: string; email: string | null; full_name: string | null; phone: string | null; marketing_opt_in: boolean; created_at: string } | null>(
    await db.from("profiles").select("id, email, full_name, phone, marketing_opt_in, created_at").eq("id", session.userId).maybeSingle(),
    "load your profile",
  );
  return {
    id: session.userId, name: p?.full_name ?? "", email: p?.email ?? session.email ?? "", phone: p?.phone ?? "",
    marketingOptIn: p?.marketing_opt_in ?? false, memberSince: p?.created_at ?? "",
  };
}

export async function updateProfile(session: Session, input: ProfileInput): Promise<void> {
  const db = await userDb();
  const patch = {
    ...(input.fullName !== undefined && { full_name: input.fullName }),
    ...(input.phone !== undefined && { phone: input.phone }),
    ...(input.marketingOptIn !== undefined && { marketing_opt_in: input.marketingOptIn }),
  };
  if (!Object.keys(patch).length) return;
  must(await db.from("profiles").update(patch).eq("id", session.userId), "update your profile");
}

// ---------- Addresses ----------
const ADDRESS_COLS = "id, label, name, phone, line1, line2, landmark, city, state, postal_code, country, is_default";
interface AddressRow {
  id: string; label: string | null; name: string; phone: string; line1: string; line2: string | null; landmark: string | null;
  city: string; state: string; postal_code: string; country: string; is_default: boolean;
}
const toAddress = (r: AddressRow): Address => ({
  id: r.id, label: r.label ?? undefined, name: r.name, phone: r.phone, line1: r.line1, line2: r.line2 ?? undefined,
  landmark: r.landmark ?? undefined, city: r.city, state: r.state, postalCode: r.postal_code, country: r.country, isDefault: r.is_default,
});
const toRow = (a: Partial<AddressInput>) => ({
  ...(a.label !== undefined && { label: a.label || null }), ...(a.name !== undefined && { name: a.name }),
  ...(a.phone !== undefined && { phone: a.phone }), ...(a.line1 !== undefined && { line1: a.line1 }),
  ...(a.line2 !== undefined && { line2: a.line2 || null }), ...(a.landmark !== undefined && { landmark: a.landmark || null }),
  ...(a.city !== undefined && { city: a.city }), ...(a.state !== undefined && { state: a.state }),
  ...(a.postalCode !== undefined && { postal_code: a.postalCode }), ...(a.country !== undefined && { country: a.country }),
  ...(a.isDefault !== undefined && { is_default: a.isDefault }),
});

export async function listAddresses(session: Session): Promise<Address[]> {
  const db = await userDb();
  const rows: AddressRow[] = must(
    await db.from("addresses").select(ADDRESS_COLS).eq("user_id", session.userId).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
    "list your addresses",
  ) ?? [];
  return rows.map(toAddress);
}

/** One default per user (partial unique index): clear the old default first. */
async function clearDefault(session: Session, exceptId?: string) {
  const db = await userDb();
  let b = db.from("addresses").update({ is_default: false }).eq("user_id", session.userId).eq("is_default", true);
  if (exceptId) b = b.neq("id", exceptId);
  must(await b, "update your addresses");
}

export async function createAddress(session: Session, input: AddressInput): Promise<Address> {
  const db = await userDb();
  if (input.isDefault) await clearDefault(session);
  const row = must<AddressRow>(
    await db.from("addresses").insert({ ...toRow(input), user_id: session.userId }).select(ADDRESS_COLS).single(), "save the address",
  );
  return toAddress(row);
}

export async function updateAddress(session: Session, id: string, input: Partial<AddressInput>): Promise<Address> {
  const db = await userDb();
  if (input.isDefault) await clearDefault(session, id);
  const row = must<AddressRow | null>(
    await db.from("addresses").update(toRow(input)).eq("id", id).eq("user_id", session.userId).select(ADDRESS_COLS).maybeSingle(), "update the address",
  );
  if (!row) throw new ApiError(404, "address_not_found", "Address not found");
  return toAddress(row);
}

export async function deleteAddress(session: Session, id: string): Promise<void> {
  const db = await userDb();
  must(await db.from("addresses").delete().eq("id", id).eq("user_id", session.userId), "delete the address");
}

// ---------- Wishlist (signed-in; guests keep a local list in the UI) ----------
export async function listWishlist(session: Session): Promise<{ items: { productId: string; variantId?: string }[]; products: Product[] }> {
  const db = await userDb();
  const rows: { product_id: string; variant_id: string | null }[] = must(
    await db.from("wishlist_items").select("product_id, variant_id").eq("user_id", session.userId).order("created_at", { ascending: false }),
    "load your wishlist",
  ) ?? [];
  const items = rows.map((r) => ({ productId: r.product_id, variantId: r.variant_id ?? undefined }));
  return { items, products: await getProductsByIds([...new Set(items.map((i) => i.productId))]) };
}

export async function addToWishlist(session: Session, input: WishlistInput): Promise<void> {
  const db = await userDb();
  must(
    await db.from("wishlist_items").upsert(
      { user_id: session.userId, product_id: input.productId, variant_id: input.variantId ?? null },
      { onConflict: "user_id,product_id,variant_id", ignoreDuplicates: true },
    ),
    "save to your wishlist",
  );
}

/** Removes the product (every variant entry) or one variant entry. */
export async function removeFromWishlist(session: Session, input: WishlistInput): Promise<void> {
  const db = await userDb();
  let b = db.from("wishlist_items").delete().eq("user_id", session.userId).eq("product_id", input.productId);
  if (input.variantId) b = b.eq("variant_id", input.variantId);
  must(await b, "update your wishlist");
}
