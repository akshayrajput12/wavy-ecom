import { loadTargetOptions } from "@/views/admin/coupons/components/loadOptions";
import { OfferEditorView } from "@/views/admin/offers/EditorView";

export const metadata = { title: "New offer" };

export default async function Page() {
  return <OfferEditorView options={await loadTargetOptions()} />;
}
