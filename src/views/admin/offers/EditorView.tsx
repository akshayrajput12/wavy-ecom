import { PageHeader } from "@/components/admin/Panel";
import type { AdminOffer } from "@/types/admin";
import type { TargetOptions } from "../coupons/components/TargetPicker";
import { Stats } from "../coupons/components/Stats";
import { OfferForm } from "./components/OfferForm";

export function OfferEditorView({ offer, options }: { offer?: AdminOffer; options: TargetOptions }) {
  return (
    <>
      <PageHeader title={offer ? `Edit ${offer.name}` : "New offer"} />
      {offer && <Stats stats={offer.stats} usageCount={offer.usageCount} limit={offer.usageLimitTotal} />}
      <OfferForm offer={offer} options={options} />
    </>
  );
}
