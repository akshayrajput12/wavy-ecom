import { PageHeader } from "@/components/admin/Panel";
import type { AdminCampaign } from "@/types/admin";
import { CampaignForm, type Pick } from "./components/CampaignForm";

export function CampaignEditorView({ campaign, coupons, offers }: { campaign?: AdminCampaign; coupons: Pick[]; offers: Pick[] }) {
  return (
    <>
      <PageHeader title={campaign ? `Edit ${campaign.name}` : "New campaign"} />
      <CampaignForm campaign={campaign} coupons={coupons} offers={offers} />
    </>
  );
}
