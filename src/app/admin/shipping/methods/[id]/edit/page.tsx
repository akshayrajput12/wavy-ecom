import { notFound } from "next/navigation";
import { listShippingZones } from "@/backend/admin/repo";
import { MethodEditorView } from "@/views/admin/shipping/MethodEditor";

export const metadata = { title: "Edit shipping method" };

export default async function Page({ params }: PageProps<"/admin/shipping/methods/[id]/edit">) {
  const { id } = await params;
  const zones = await listShippingZones();
  const method = zones.flatMap((z) => z.methods).find((m) => m.id === id);
  if (!method) notFound();
  return <MethodEditorView method={method} zones={zones} />;
}
