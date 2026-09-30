import { Newspaper } from "lucide-react";
import { ArticleCard, Pagination } from "@/components/commerce";
import { EmptyState } from "@/components/ui/States";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { blogCopy as c } from "@/data/copy";
import type { BlogPost, Paginated } from "@/types/domain";

export function BlogView({ posts, params }: { posts: Paginated<BlogPost>; params: Record<string, string | string[] | undefined> }) {
  const [lead, ...rest] = posts.items;
  const first = posts.page === 1;
  return (
    <div className="container-x pb-24">
      <header className="border-b border-line py-10 lg:py-16">
        <h1 className="t-hero">{c.title}</h1>
      </header>
      {!lead ? (
        <div className="mt-10"><EmptyState icon={<Newspaper className="size-7" aria-hidden />} title={c.empty} /></div>
      ) : (
        <>
          {first && <Reveal className="mt-12"><ArticleCard post={lead} large /></Reveal>}
          <Stagger as="ul" className="mt-14 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {(first ? rest : posts.items).map((p) => <StaggerItem as="li" key={p.id}><ArticleCard post={p} /></StaggerItem>)}
          </Stagger>
          <Pagination page={posts.page} total={posts.total} pageSize={posts.pageSize} path="/blog" params={params} />
        </>
      )}
    </div>
  );
}
