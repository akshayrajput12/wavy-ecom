import type { Metadata } from "next";
import { SignupView } from "@/views/auth/SignupView";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <SignupView next={(await searchParams).next} />;
}
