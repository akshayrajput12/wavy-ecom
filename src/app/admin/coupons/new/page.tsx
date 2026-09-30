import { CouponEditorView } from "@/views/admin/coupons/EditorView";
import { loadTargetOptions } from "@/views/admin/coupons/components/loadOptions";

export const metadata = { title: "New coupon" };

export default async function Page() {
  return <CouponEditorView options={await loadTargetOptions()} />;
}
