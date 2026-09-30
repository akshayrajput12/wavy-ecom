import { notFound } from "next/navigation";
import { getOffer } from "@/backend/admin/repo";
import { loadTargetOptions } from "@/views/admin/coupons/components/loadOptions";
import { OfferEditorView } from "@/views/admin/offers/EditorView";

export const metadata = { title: "Edit offer" };

export default async function Page({ params }: PageProps<"/admin/offers/[id]/edit">) {
  const [offer, options] = await Promise.all([params.then((p) => getOffer(p.id)), loadTargetOptions()]);
  if (!offer) notFound();
  return <OfferEditorView offer={offer} options={options} />;
}
