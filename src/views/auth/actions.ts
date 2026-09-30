"use server";

import { redirect } from "next/navigation";
import { authCopy } from "@/data/account";
import { site } from "@/data/site";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, resetSchema, signupSchema, type AuthResult } from "./schema";

/** Only allow same-site relative redirects (no open redirect via ?next=). */
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");
const invalid: AuthResult = { error: "Please check the highlighted fields." };

export async function signIn(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid;
  if (!hasSupabase) return { error: authCopy.notConfigured };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  // generic message: don't reveal whether the email exists
  if (error) return { error: "That email and password don't match. Try again or reset your password." };
  redirect(safeNext(parsed.data.next));
}

export async function signUp(input: unknown): Promise<AuthResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return invalid;
  if (!hasSupabase) return { error: authCopy.notConfigured };
  const { name, email, phone, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, phone, terms_accepted_at: new Date().toISOString() }, emailRedirectTo: `${site.url}/account` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then log in." };
  redirect("/account");
}

export async function resetPassword(input: unknown): Promise<AuthResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return invalid;
  if (!hasSupabase) return { error: authCopy.notConfigured };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${site.url}/account/profile` });
  return { message: authCopy.forgot.sent }; // same reply whether or not the account exists
}

export async function signOut() {
  if (hasSupabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
