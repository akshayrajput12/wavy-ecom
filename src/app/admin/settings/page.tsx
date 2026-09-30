import { getStoreSettings } from "@/backend/admin/repo";
import { SettingsView } from "@/views/admin/settings/View";

export const metadata = { title: "Settings" };

export default async function Page() {
  return <SettingsView settings={await getStoreSettings()} />;
}
