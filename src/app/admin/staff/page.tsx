import { listStaff } from "@/backend/admin/repo";
import { StaffView } from "@/views/admin/staff/View";

export const metadata = { title: "Staff" };

export default async function Page() {
  return <StaffView staff={await listStaff()} />;
}
