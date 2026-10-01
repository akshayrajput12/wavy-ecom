/** Store settings, shipping, integrations, staff, customers, audit, analytics and upload inputs (client-safe). */
import { z } from "zod";
import { optText } from "./catalog";

const page = { page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) };

/** Public URL of an uploaded brand asset (logo, favicon); null clears it. */
const assetUrl = z.url({ protocol: /^https?$/ }).max(1024).nullable();

/** PATCH /settings/:section. Each section maps to one permission (store_settings_guard enforces the same split). */
export const SETTINGS_SECTIONS = {
  general: {
    permission: "settings.write",
    schema: z.object({
      storeName: z.string().trim().min(1).max(80), currency: z.string().length(3), locale: z.string().min(2).max(10),
      timezone: z.string().min(1).max(60), returnWindowDays: z.number().int().min(0).max(90),
      reservationTtlMinutes: z.number().int().min(5).max(1440), lowStockDefault: z.number().int().min(0),
      supportEmail: z.email().nullable(), supportPhone: z.string().max(20).nullable(),
      logoUrl: assetUrl, logoDarkUrl: assetUrl, faviconUrl: assetUrl,
    }).partial(),
  },
  tax: {
    permission: "settings.tax.manage",
    schema: z.object({
      taxPercentage: z.number().min(0).max(100).multipleOf(0.01), taxInclusive: z.boolean(),
      gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Invalid GSTIN").nullable(),
      // seller identity printed on GST invoices (0021_invoices.sql)
      legalName: z.string().trim().min(1).max(200).nullable(), registeredAddress: z.string().trim().min(1).max(500).nullable(),
    }).partial(),
  },
  shipping: {
    permission: "settings.shipping.manage",
    schema: z.object({
      freeShippingThreshold: z.number().int().min(0).nullable(), flatShippingFee: z.number().int().min(0),
      codEnabled: z.boolean(), codFee: z.number().int().min(0), codMaxOrderAmount: z.number().int().positive().nullable(),
    }).partial(),
  },
} as const;
export type SettingsSection = keyof typeof SETTINGS_SECTIONS;

const zoneShape = z.object({
  name: z.string().trim().min(1).max(80), states: z.array(z.string().trim().min(1).max(80)).max(60).optional(),
  isDefault: z.boolean().optional(), isActive: z.boolean().optional(),
});
export const ShippingZoneSchema = zoneShape;
export const ShippingZonePatchSchema = zoneShape.partial();

const methodShape = z.object({
  zoneId: z.uuid(), code: z.string().regex(/^[a-z0-9_]+$/).max(40), name: z.string().trim().min(1).max(80),
  description: optText(300), rate: z.number().int().min(0), freeAbove: z.number().int().min(0).nullable().optional(),
  codAvailable: z.boolean().optional(), minDays: z.number().int().min(0).optional(), maxDays: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(), sortOrder: z.number().int().optional(),
});
const daysOk = (m: { minDays?: number; maxDays?: number }) => m.minDays === undefined || m.maxDays === undefined || m.maxDays >= m.minDays;
export const ShippingMethodSchema = methodShape.refine(daysOk, { path: ["maxDays"], message: "Max days must be ≥ min days" });
export const ShippingMethodPatchSchema = methodShape.partial().refine(daysOk, { path: ["maxDays"], message: "Max days must be ≥ min days" });

export const IntegrationPatchSchema = z.object({
  isActive: z.boolean().optional(), environment: z.enum(["test", "live"]).optional(),
  status: z.enum(["connected", "needs_attention", "disconnected"]).optional(),
  /** Non-secret keys only; merged into the stored config. Secrets stay in env (secret_ref names them). */
  config: z.record(z.string(), z.unknown()).optional(),
});

export const STAFF_ROLES = ["super_admin", "catalog_manager", "order_manager", "marketing_manager", "analyst", "support_agent"] as const;
export const StaffInviteSchema = z.object({ email: z.email().transform((e) => e.toLowerCase()), fullName: optText(120), role: z.enum(STAFF_ROLES) });
export const StaffPatchSchema = z.object({
  role: z.enum(STAFF_ROLES).optional(), status: z.enum(["active", "suspended"]).optional(), suspendedReason: optText(300),
  fullName: optText(120),
});

export const CustomerListQuery = z.object({ q: z.string().max(100).optional(), status: z.enum(["active", "blocked", "deleted"]).optional(), ...page });
export const CustomerPatchSchema = z.object({ status: z.enum(["active", "blocked"]) });

export const AuditQuery = z.object({
  entityType: z.string().max(60).optional(), entityId: z.string().max(100).optional(), actorId: z.uuid().optional(),
  action: z.string().max(60).optional(), from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional(),
  ...page,
});
export const AnalyticsQuery = z.object({ from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional() });

/** Buckets from supabase/migrations/0017_storage.sql (limits mirror file_size_limit / allowed_mime_types). */
export const UPLOAD_BUCKETS = {
  "product-media": { maxBytes: 10_485_760, mime: ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"] },
  "category-media": { maxBytes: 5_242_880, mime: ["image/jpeg", "image/png", "image/webp", "image/avif"] },
  "collection-media": { maxBytes: 5_242_880, mime: ["image/jpeg", "image/png", "image/webp", "image/avif"] },
  "content-media": { maxBytes: 10_485_760, mime: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "video/mp4"] },
} as const;
export type UploadBucket = keyof typeof UPLOAD_BUCKETS;
export const UploadMetaSchema = z.object({
  bucket: z.enum(Object.keys(UPLOAD_BUCKETS) as [UploadBucket, ...UploadBucket[]]),
  /** Folder inside the bucket, e.g. the product slug. */
  folder: z.string().regex(/^[a-z0-9][a-z0-9/_-]{0,120}$/).optional(),
});
export const UploadDeleteSchema = z.object({ bucket: UploadMetaSchema.shape.bucket, path: z.string().min(1).max(512).refine((p) => !p.includes(".."), "Invalid path") });
