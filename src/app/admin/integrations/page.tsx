import { listIntegrations } from "@/backend/admin/repo";
import { IntegrationsView } from "@/views/admin/integrations/View";

export const metadata = { title: "Integrations" };

export default async function Page() {
  return <IntegrationsView items={await listIntegrations()} />;
}
