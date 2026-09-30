import { listCollections } from "@/backend/admin/repo";
import { CollectionsView } from "@/views/admin/collections/View";

export const metadata = { title: "Collections" };

export default async function Page() {
  return <CollectionsView collections={await listCollections()} />;
}
