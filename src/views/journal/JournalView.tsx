import { ArticleCard } from "@/components/commerce";
import { Reveal } from "@/components/ui/Reveal";
import { journalCopy as c } from "@/data/content";
import type { BlogPost } from "@/types/domain";

export function JournalView({ posts }: { posts: BlogPost[] }) {
  const [lead, ...rest] = posts;
  return (
    <div className="container-x pb-24">
      <header className="border-b border-line py-10 lg:py-16">
        <p className="t-overline text-ink-soft">{c.overline}</p>
        <h1 className="t-hero mt-3">{c.title}</h1>
        <p className="mt-4 max-w-xl text-body-lg text-ink-soft">{c.intro}</p>
      </header>
      {lead && <Reveal className="mt-12"><ArticleCard post={lead} large /></Reveal>}
      <ul className="mt-16 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => <Reveal as="li" key={p.id} delay={(i % 3) * 0.08}><ArticleCard post={p} /></Reveal>)}
      </ul>
    </div>
  );
}
