import { z } from "zod";
import { PRODUCT_STATUS, type Product } from "@/types/domain";

const rupees = z.number({ error: "Enter an amount" }).min(0, "Can't be negative");

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  descriptor: z.string().trim().min(2, "Short descriptor is required"),
  description: z.string().trim().min(10, "Write at least a sentence"),
  categoryId: z.string().min(1, "Pick a category"),
  material: z.string().optional(),
  status: z.enum(PRODUCT_STATUS),
  tryOnEnabled: z.boolean(),
  images: z.array(z.object({ url: z.url("Must be a URL"), alt: z.string().trim().min(2, "Alt text is required") })),
  variants: z.array(z.object({
    id: z.string(), sku: z.string().trim().min(2, "SKU required"), color: z.string().trim().min(1, "Required"),
    size: z.string().trim().min(1, "Required"), price: rupees, compareAt: rupees.optional(), stock: z.number().int().min(0),
  })).min(1, "Add at least one variant"),
  seoTitle: z.string().max(70, "Keep under 70 characters"),
  seoDescription: z.string().max(170, "Keep under 170 characters"),
});
export type ProductForm = z.infer<typeof productSchema>;

/** Form works in rupees; storage is paise. */
export const toForm = (p: Product | null): ProductForm => ({
  name: p?.name ?? "", slug: p?.slug ?? "", descriptor: p?.descriptor ?? "", description: p?.description ?? "",
  categoryId: p?.categoryId ?? "", material: p?.material ?? "", status: p?.status ?? "draft", tryOnEnabled: p?.tryOnEnabled ?? false,
  images: p?.images.map((i) => ({ url: i.url, alt: i.alt })) ?? [],
  variants: p?.variants.map((v) => ({ id: v.id, sku: v.sku, color: v.color, size: v.size, price: v.price / 100, compareAt: v.compareAt && v.compareAt / 100, stock: v.stock }))
    ?? [{ id: "new-0", sku: "", color: "", size: "", price: 0, stock: 0 }],
  seoTitle: p?.seo?.title ?? "", seoDescription: p?.seo?.description ?? "",
});
