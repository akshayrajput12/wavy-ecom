import { notFound } from "next/navigation";
import { listCoupons } from "@/backend/admin/repo";
import { CouponEditorView } from "@/views/admin/coupons/EditorView";
import { loadTargetOptions } from "@/views/admin/coupons/components/loadOptions";

export const metadata = { title: "Edit coupon" };

export default async function Page({ params }: PageProps<"/admin/coupons/[code]/edit">) {
  const code = decodeURIComponent((await params).code).toUpperCase();
  const [coupons, options] = await Promise.all([listCoupons(), loadTargetOptions()]);
  const coupon = coupons.find((c) => c.code === code);
  if (!coupon) notFound();
  return <CouponEditorView coupon={coupon} options={options} />;
}
