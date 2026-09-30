import { listRedirects, listSeoOverrides } from "@/backend/admin/repo";
import { SeoView } from "@/views/admin/seo/View";

export const metadata = { title: "SEO" };

export default async function Page() {
  const [overrides, redirects] = await Promise.all([listSeoOverrides(), listRedirects()]);
  return <SeoView overrides={overrides} redirects={redirects} />;
}
