/** Coupons, offers, discount targets and reviews inputs (client-safe). */
import { z } from "zod";
import { CAMPAIGN_STATUS, COUPON_STATUS, REVIEW_STATUS } from "@/types/domain";
import { isoDate, optText, optUrl, slug, text } from "./catalog";

export const DiscountTargetSchema = z.object({
  mode: z.enum(["include", "exclude"]).default("include"),
  kind: z.enum(["product", "variant", "category", "collection"]),
  id: z.uuid(),
});
/** No include rows = applies to everything; exclude wins; a category matches its descendants. */
export const DiscountTargetsSchema = z.array(DiscountTargetSchema).max(500).superRefine((targets, ctx) => {
  const seen = new Map<string, number>();
  targets.forEach((t, i) => {
    const key = `${t.kind}:${t.id}`;
    if (seen.has(key)) ctx.addIssue({ code: "custom", path: [i], message: `${t.kind} is listed twice (include and exclude cannot overlap)` });
    seen.set(key, i);
  });
});
export type DiscountTargetInput = z.infer<typeof DiscountTargetSchema>;

const windowOk = (v: { startsAt?: string | null; endsAt?: string | null }) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt;

const couponShape = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/, "3-32 letters, numbers, _ or -").transform((c) => c.toUpperCase()),
  description: optText(300),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  /** percent: 1-100; fixed: paise; free_shipping: 0. */
  value: z.number().int().min(0).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  maxDiscountAmount: z.number().int().positive().nullable().optional(),
  usageLimitTotal: z.number().int().positive().nullable().optional(),
  usageLimitPerUser: z.number().int().positive().nullable().optional(),
  firstOrderOnly: z.boolean().optional(),
  combinableWithOffers: z.boolean().optional(),
  startsAt: isoDate, endsAt: isoDate,
  status: z.enum(COUPON_STATUS).optional(),
  targets: DiscountTargetsSchema.optional(),
});
type CouponLike = { type?: "percent" | "fixed" | "free_shipping"; value?: number };
function couponValue(c: CouponLike, ctx: z.RefinementCtx) {
  if (!c.type) return;
  const v = c.value ?? 0;
  const bad = c.type === "percent" ? v < 1 || v > 100 : c.type === "fixed" ? v <= 0 : v !== 0;
  if (bad) ctx.addIssue({ code: "custom", path: ["value"], message: c.type === "percent" ? "Percent must be 1-100" : c.type === "fixed" ? "Amount (paise) must be above 0" : "Free shipping has no value" });
}
export const CouponSchema = couponShape.superRefine((c, ctx) => {
  couponValue(c, ctx);
  if (!windowOk(c)) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
});
/** PATCH: send type together with value when changing either. */
export const CouponPatchSchema = couponShape.partial().superRefine((c, ctx) => {
  if (c.type !== undefined || c.value !== undefined) couponValue(c, ctx);
  if (!windowOk(c)) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
});
export const BulkCouponStatusSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200), status: z.enum(COUPON_STATUS) });

const offerShape = z.object({
  name: text(120).min(1), slug, description: optText(500),
  type: z.enum(["bundle_fixed_price", "bogo", "tiered_percent"]),
  status: z.enum(COUPON_STATUS).optional(),
  priority: z.number().int().optional(),
  requiredQty: z.number().int().min(2).nullable().optional(),
  bundlePrice: z.number().int().positive().nullable().optional(),
  buyQty: z.number().int().min(1).nullable().optional(),
  getQty: z.number().int().min(1).nullable().optional(),
  getDiscountPercent: z.number().int().min(1).max(100).nullable().optional(),
  tiers: z.array(z.object({ minQty: z.number().int().min(2), percent: z.number().int().min(1).max(100) })).min(1).max(10).nullable().optional(),
  maxApplicationsPerOrder: z.number().int().positive().nullable().optional(),
  usageLimitTotal: z.number().int().positive().nullable().optional(),
  startsAt: isoDate, endsAt: isoDate,
  badgeText: optText(40), nudgeTemplate: optText(160),
  targets: DiscountTargetsSchema.optional(),
});
const OFFER_NEEDS = {
  bundle_fixed_price: ["requiredQty", "bundlePrice"], bogo: ["buyQty", "getQty", "getDiscountPercent"], tiered_percent: ["tiers"],
} as const;
export const OfferSchema = offerShape.superRefine((o, ctx) => {
  for (const k of OFFER_NEEDS[o.type]) if (o[k] == null) ctx.addIssue({ code: "custom", path: [k], message: `Required for ${o.type}` });
  if (!windowOk(o)) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
});
/** PATCH: the DB CHECK still requires the type's fields; send them with a type change. */
export const OfferPatchSchema = offerShape.partial().superRefine((o, ctx) => {
  if (!windowOk(o)) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
});

// ---------- Reviews ----------
export const ReviewListQuery = z.object({
  status: z.enum(REVIEW_STATUS).optional(), productId: z.uuid().optional(), source: z.enum(["customer", "admin", "import"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(), q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
const reviewShape = z.object({
  productId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  title: text(120).optional(), body: text(5000).optional(),
  authorName: text(60).min(1), authorLocation: optText(60),
  status: z.enum(REVIEW_STATUS).optional(),
  verifiedPurchase: z.boolean().optional(),
  /** Backdate an imported/admin review. */
  createdAt: z.iso.datetime({ offset: true }).optional(),
});
export const ReviewSchema = reviewShape;
export const ReviewPatchSchema = reviewShape.omit({ productId: true }).partial();
export const ModerateSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200), status: z.enum(REVIEW_STATUS), note: optText(500) });

// ---------- Campaigns ----------
const campaignShape = z.object({
  name: text(120).min(1), slug, status: z.enum(CAMPAIGN_STATUS).optional(),
  channel: z.enum(["site", "email", "instagram", "whatsapp", "sms", "paid_social", "google", "influencer"]).optional(),
  description: optText(1000), heroImageUrl: optUrl, heroImageAlt: optText(200),
  content: z.record(z.string(), z.unknown()).optional(),
  utmCampaign: z.string().trim().regex(/^[a-z0-9_-]{1,60}$/).nullable().optional(),
  couponId: z.uuid().nullable().optional(), offerId: z.uuid().nullable().optional(),
  budgetPaise: z.number().int().min(0).nullable().optional(),
  startsAt: isoDate, endsAt: isoDate, seoTitle: optText(70), seoDescription: optText(170),
});
export const CampaignSchema = campaignShape.refine(windowOk, { path: ["endsAt"], message: "End must be after start" });
export const CampaignPatchSchema = campaignShape.partial().refine(windowOk, { path: ["endsAt"], message: "End must be after start" });
