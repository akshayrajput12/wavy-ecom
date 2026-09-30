import { listCategoryOptions, listCollections, listHomeSections, listProductOptions } from "@/backend/admin/repo";
import { HomeSectionsView } from "@/views/admin/home-sections/View";

export const metadata = { title: "Home page" };

export default async function Page() {
  const [sections, categories, collections, products] = await Promise.all([listHomeSections(), listCategoryOptions(), listCollections(), listProductOptions()]);
  return (
    <HomeSectionsView
      sections={sections}
      lookups={{
        categories: categories.map((c) => ({ id: c.id, label: c.name })),
        collections: collections.map((c) => ({ id: c.id, label: c.name })),
        products: products.map((p) => ({ id: p.id, label: p.name })),
      }}
    />
  );
}
