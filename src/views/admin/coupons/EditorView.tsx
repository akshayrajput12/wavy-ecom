import { PageHeader } from "@/components/admin/Panel";
import type { AdminCoupon } from "@/types/admin";
import { CouponForm } from "./components/CouponForm";
import { Stats } from "./components/Stats";
import type { TargetOptions } from "./components/TargetPicker";

export function CouponEditorView({ coupon, options }: { coupon?: AdminCoupon; options: TargetOptions }) {
  return (
    <>
      <PageHeader title={coupon ? `Edit ${coupon.code}` : "New coupon"} />
      {coupon && <Stats stats={coupon.stats} usageCount={coupon.usageCount} limit={coupon.usageLimitTotal} />}
      <CouponForm coupon={coupon} options={options} />
    </>
  );
}
