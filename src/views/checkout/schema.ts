import { z } from "zod";
import { INDIAN_STATES } from "@/data/copy";

/** Same rules as backend/account/schema.ts, with shopper-friendly messages. */
const phone = z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

export const contactSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  phone,
});
export type ContactValues = z.infer<typeof contactSchema>;

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's full name").max(120),
  phone,
  line1: z.string().trim().min(3, "Enter house number and street").max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: z.enum(INDIAN_STATES, "Select a state"),
  isDefault: z.boolean().optional(),
});
export type AddressValues = z.infer<typeof addressSchema>;
