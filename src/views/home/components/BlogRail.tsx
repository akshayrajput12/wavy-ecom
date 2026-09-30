import { ArticleCard } from "@/components/commerce/ArticleCard";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { blogCopy } from "@/data/copy";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

export function BlogRail({ section }: { section: HomeSectionOf<"blog_rail"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead title={section.title ?? blogCopy.title} subtitle={section.subtitle} cta={{ label: homeCopy.viewAll, href: "/blog" }} />
      <Stagger as="ul" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.posts.slice(0, 3).map((p) => <StaggerItem as="li" key={p.id}><ArticleCard post={p} /></StaggerItem>)}
      </Stagger>
    </section>
  );
}
