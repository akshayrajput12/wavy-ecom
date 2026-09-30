import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});
export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  password: z.string().min(8, "Use at least 8 characters"),
  terms: z.literal(true, "Please accept the terms to continue"),
});
export const resetSchema = z.object({ email: z.email("Enter a valid email address") });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
export type AuthResult = { error?: string; message?: string };
