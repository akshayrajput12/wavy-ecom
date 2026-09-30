import type { Metadata } from "next";
import { LoginView } from "@/views/auth/LoginView";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginView next={next} />;
}
