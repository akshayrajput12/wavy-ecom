import "server-only";
import { listCoupons, listOffers } from "@/backend/admin/repo";

/** Coupon and offer choices for the campaign form. */
export async function loadPicks() {
  const [coupons, offers] = await Promise.all([listCoupons(), listOffers()]);
  return { coupons: coupons.map((c) => ({ id: c.id, label: c.code })), offers: offers.map((o) => ({ id: o.id, label: o.name })) };
}
