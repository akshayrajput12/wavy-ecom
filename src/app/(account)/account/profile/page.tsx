import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountUser } from "@/backend/orders/repo";
import { ProfileView } from "@/views/account/ProfileView";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getAccountUser();
  if (!user) redirect("/login?next=/account/profile");
  return <ProfileView user={user} />;
}
