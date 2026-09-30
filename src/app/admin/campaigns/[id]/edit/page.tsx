import { notFound } from "next/navigation";
import { getResource } from "@/backend/admin/repo";
import type { AdminCampaign } from "@/types/admin";
import { CampaignEditorView } from "@/views/admin/campaigns/EditorView";
import { loadPicks } from "@/views/admin/campaigns/loadPicks";

export const metadata = { title: "Edit campaign" };

export default async function Page({ params }: PageProps<"/admin/campaigns/[id]/edit">) {
  const [campaign, picks] = await Promise.all([params.then((p) => getResource<AdminCampaign>("campaigns", p.id)), loadPicks()]);
  if (!campaign) notFound();
  return <CampaignEditorView campaign={campaign} {...picks} />;
}
