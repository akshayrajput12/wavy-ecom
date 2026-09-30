import { getCurrentStaff, getStaff } from "@/backend/admin/repo";
import { StaffView } from "@/views/admin/staff/View";

export const metadata = { title: "Staff" };

export default async function Page() {
  const [staff, me] = await Promise.all([getStaff(), getCurrentStaff()]);
  return <StaffView staff={staff} meId={me.id} />;
}
