import { getCampaigns } from "@/backend/admin/repo";
import { CampaignsView } from "@/views/admin/campaigns/View";

export const metadata = { title: "Campaigns" };

export default async function Page() {
  return <CampaignsView campaigns={await getCampaigns()} />;
}
