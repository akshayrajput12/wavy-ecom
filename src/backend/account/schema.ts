import { z } from "zod";

const phone = z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

export const AddressSchema = z.object({
  label: z.string().trim().max(40).optional(),
  name: z.string().trim().min(1).max(120),
  phone,
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  country: z.string().trim().length(2).default("IN"),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof AddressSchema>;
export const AddressPatchSchema = AddressSchema.partial();

export const ProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: phone.optional(),
  marketingOptIn: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;

export const WishlistSchema = z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional() });
export type WishlistInput = z.infer<typeof WishlistSchema>;
