import { InventoryView } from "@/views/admin/inventory/View";

export const metadata = { title: "Inventory" };

export default async function Page({ searchParams }: PageProps<"/admin/inventory">) {
  const { filter } = await searchParams;
  return <InventoryView initialFilter={typeof filter === "string" ? filter : undefined} />;
}
