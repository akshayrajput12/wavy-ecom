import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import type { PaymentOption, StoreSettings } from "@/types/domain";

interface SettingsRow {
  store_name: string; currency: string; locale: string; support_email: string | null; support_phone: string | null;
  free_shipping_threshold: number | null; flat_shipping_fee: number; cod_enabled: boolean; cod_fee: number;
  cod_max_order_amount: number | null; return_window_days: number; tax_percentage: number; tax_inclusive: boolean;
  logo_url: string | null; logo_dark_url: string | null; favicon_url: string | null;
}
const COLS =
  "store_name, currency, locale, support_email, support_phone, free_shipping_threshold, flat_shipping_fee, cod_enabled, " +
  "cod_fee, cod_max_order_amount, return_window_days, tax_percentage, tax_inclusive, logo_url, logo_dark_url, favicon_url";

/** Singleton store_settings (non-secret). Null when Supabase is not configured. */
export const getStoreSettings = cached("settings.store", [TAGS.settings], async (): Promise<StoreSettings | null> => {
  const db = publicDb();
  if (!db) return null;
  const r: SettingsRow | null = safe(await db.from("store_settings").select(COLS).maybeSingle(), "get store settings", null);
  if (!r) return null;
  return {
    storeName: r.store_name, currency: r.currency, locale: r.locale,
    supportEmail: r.support_email ?? undefined, supportPhone: r.support_phone ?? undefined,
    freeShippingThreshold: r.free_shipping_threshold ?? undefined, flatShippingFee: r.flat_shipping_fee,
    codEnabled: r.cod_enabled, codFee: r.cod_fee, codMaxOrderAmount: r.cod_max_order_amount ?? undefined,
    returnWindowDays: r.return_window_days, taxPercentage: Number(r.tax_percentage), taxInclusive: r.tax_inclusive,
    logoUrl: r.logo_url ?? undefined, logoDarkUrl: r.logo_dark_url ?? undefined, faviconUrl: r.favicon_url ?? undefined,
  };
});

/** Enabled payment gateways for the checkout payment step (COD also depends on store_settings.cod_enabled). */
export const listPaymentOptions = cached("settings.gateways", [TAGS.settings], async (): Promise<PaymentOption[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: {
    provider: PaymentOption["provider"]; display_name: string; description: string | null; supported_methods: string[];
    min_amount: number | null; max_amount: number | null;
  }[] = safe(
    await db.from("payment_gateways").select("provider, display_name, description, supported_methods, min_amount, max_amount").order("sort_order"),
    "list payment gateways", [],
  );
  const settings = await getStoreSettings();
  return rows
    .filter((r) => r.provider !== "cod" || settings?.codEnabled)
    .map((r) => ({
      provider: r.provider, displayName: r.display_name, description: r.description ?? undefined,
      supportedMethods: r.supported_methods ?? [], minAmount: r.min_amount ?? undefined,
      maxAmount: r.provider === "cod" ? (settings?.codMaxOrderAmount ?? r.max_amount ?? undefined) : (r.max_amount ?? undefined),
    }));
});
