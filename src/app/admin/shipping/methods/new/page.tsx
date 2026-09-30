import { listShippingZones } from "@/backend/admin/repo";
import { MethodEditorView } from "@/views/admin/shipping/MethodEditor";

export const metadata = { title: "New shipping method" };

export default async function Page({ searchParams }: PageProps<"/admin/shipping/methods/new">) {
  const { zoneId } = await searchParams;
  return <MethodEditorView method={null} zones={await listShippingZones()} zoneId={typeof zoneId === "string" ? zoneId : undefined} />;
}
