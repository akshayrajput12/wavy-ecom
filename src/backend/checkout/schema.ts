import { z } from "zod";
import { AddressSchema } from "@/backend/account/schema";
import { CartItemsSchema } from "@/backend/pricing/schema";
import { PAYMENT_PROVIDER } from "@/types/domain";

const Address = AddressSchema.omit({ isDefault: true, label: true });

export const CheckoutSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  phone: AddressSchema.shape.phone,
  customerName: z.string().trim().max(120).optional(),
  shippingAddress: Address,
  billingAddress: Address.optional(),
  items: CartItemsSchema.min(1),
  couponCode: z.string().trim().max(40).optional().transform((s) => s || undefined),
  shippingMethodId: z.string().uuid().optional(),
  paymentProvider: z.enum(PAYMENT_PROVIDER),
  notes: z.string().trim().max(500).optional(),
  /** Signed-in only: also save the shipping address to the address book. */
  saveAddress: z.boolean().optional(),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

/** Client-generated per checkout attempt (e.g. crypto.randomUUID()), reused on retries of the same submit. */
export const IdempotencyKey = z.string().trim().min(8).max(200);
