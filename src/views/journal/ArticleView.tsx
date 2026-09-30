import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleCard } from "@/components/commerce";
import { formatDate } from "@/lib/format";
import { journalCopy as c } from "@/data/content";
import type { BlogPost } from "@/types/domain";

/** Renders the tiny body format from data/journal.ts: blank-line paragraphs, "## " subheads, "> " pull quotes. */
function Body({ text }: { text: string }) {
  return (
    <div className="space-y-6 text-body-lg leading-relaxed text-ink-soft">
      {text.split(/\n{2,}/).map((block, i) =>
        block.startsWith("## ") ? <h2 key={i} className="t-h2 pt-6 text-ink">{block.slice(3)}</h2>
        : block.startsWith("> ") ? <blockquote key={i} className="my-10 border-l-2 border-accent pl-6 font-serif text-h1 leading-snug text-ink">{block.slice(2)}</blockquote>
        : <p key={i}>{block}</p>,
      )}
    </div>
  );
}

export function ArticleView({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const minutes = Math.max(1, Math.round(post.body.split(/\s+/).length / 220));
  return (
    <article className="pb-24">
      <header className="container-x max-w-4xl py-10 text-center lg:py-16">
        <Link href="/journal" className="inline-flex min-h-11 items-center gap-2 text-meta text-ink-soft hover:text-ink"><ArrowLeft className="size-4" aria-hidden />{c.back}</Link>
        <p className="t-overline mt-6 text-ink-soft">{post.tags.join(" · ")}</p>
        <h1 className="t-hero mt-4 text-balance">{post.title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-body-lg text-ink-soft">{post.excerpt}</p>
        <p className="mt-6 text-meta text-ink-soft">{post.author} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {c.minRead(minutes)}</p>
      </header>
      <div className="relative mx-auto aspect-[16/9] max-w-[var(--container)] overflow-hidden">
        <Image src={post.cover.url} alt={post.cover.alt} fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="container-x mt-14 max-w-2xl"><Body text={post.body} /></div>
      {related.length > 0 && (
        <section className="container-x mt-24 border-t border-line pt-12">
          <h2 className="t-display mb-10">{c.related}</h2>
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <li key={p.id}><ArticleCard post={p} /></li>)}</ul>
        </section>
      )}
    </article>
  );
}
