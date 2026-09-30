import { getSeo } from "@/backend/admin/repo";
import { SeoView } from "@/views/admin/seo/View";

export const metadata = { title: "SEO" };

export default async function Page() {
  return <SeoView data={await getSeo()} />;
}
