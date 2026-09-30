import { getInventoryReasons, getProducts, getStoreSettings } from "@/backend/admin/repo";
import { InventoryView } from "@/views/admin/inventory/View";

export const metadata = { title: "Inventory" };

export default async function Page({ searchParams }: PageProps<"/admin/inventory">) {
  const { filter } = await searchParams;
  const [products, reasons, settings] = await Promise.all([getProducts(), getInventoryReasons(), getStoreSettings()]);
  return <InventoryView products={products} reasons={reasons} threshold={settings.lowStockThreshold} initialFilter={typeof filter === "string" ? filter : undefined} />;
}
