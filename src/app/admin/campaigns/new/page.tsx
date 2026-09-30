import { CampaignEditorView } from "@/views/admin/campaigns/EditorView";
import { loadPicks } from "@/views/admin/campaigns/loadPicks";

export const metadata = { title: "New campaign" };

export default async function Page() {
  return <CampaignEditorView {...await loadPicks()} />;
}
