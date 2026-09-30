import { notFound } from "next/navigation";
import { listShippingZones } from "@/backend/admin/repo";
import { ZoneEditorView } from "@/views/admin/shipping/ZoneEditor";

export const metadata = { title: "Edit shipping zone" };

export default async function Page({ params }: PageProps<"/admin/shipping/zones/[id]/edit">) {
  const { id } = await params;
  const zone = (await listShippingZones()).find((z) => z.id === id);
  if (!zone) notFound();
  return <ZoneEditorView zone={zone} />;
}
