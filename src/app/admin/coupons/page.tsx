import { listCoupons } from "@/backend/admin/repo";
import { CouponsView } from "@/views/admin/coupons/View";

export const metadata = { title: "Coupons" };

export default async function Page() {
  return <CouponsView coupons={await listCoupons()} />;
}
