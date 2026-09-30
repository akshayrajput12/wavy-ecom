import { listContentPages } from "@/backend/admin/repo";
import { PagesView } from "@/views/admin/pages/View";

export const metadata = { title: "Pages" };

export default async function Page() {
  return <PagesView pages={await listContentPages()} />;
}
