"use server";

import { z } from "zod";
import { getProductsByIds } from "@/backend/catalog/repo";
import type { Product } from "@/types/domain";

/** Resolves a guest's locally saved product ids (published products only; public catalog data). */
export async function resolveWishlist(ids: unknown): Promise<Product[]> {
  const parsed = z.array(z.string().uuid()).max(100).safeParse(ids);
  return parsed.success ? getProductsByIds(parsed.data) : [];
}
