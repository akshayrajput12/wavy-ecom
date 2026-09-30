import type { Metadata } from "next";
import { getProductsByIds } from "@/backend/catalog/repo";
import { getLookbook } from "@/backend/content/repo";
import { LookbookView } from "@/views/content/LookbookView";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLookbook();
  return { title: `${l.overline} — ${l.title}`, description: l.intro };
}

export default async function LookbookRoute() {
  const lookbook = await getLookbook();
  const products = await getProductsByIds([...new Set(lookbook.looks.flatMap((l) => l.productIds))]);
  return <LookbookView lookbook={lookbook} products={products} />;
}
