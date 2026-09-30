import { z } from "zod";
import { INDIAN_STATES } from "@/data/checkout";

export const contactSchema = z.object({
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  marketing: z.boolean(),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's full name"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  line1: z.string().trim().min(5, "Enter house number and street"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Enter a city"),
  state: z.enum(INDIAN_STATES, "Select a state"),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().optional(),
});
export type AddressValues = z.infer<typeof addressSchema>;
