import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { ArticleCard } from "@/components/commerce";
import { formatDate } from "@/lib/format";
import { blogCopy as c } from "@/data/copy";
import type { BlogPost } from "@/types/domain";

/** Minimal body format: blank-line paragraphs, "## " subheads, "> " pull quotes. Reading measure ~68ch. */
export function RichText({ text }: { text: string }) {
  return (
    <div className="max-w-[68ch] space-y-6 text-body-lg leading-relaxed text-ink-soft">
      {text.split(/\n{2,}/).map((block, i) =>
        block.startsWith("## ") ? <h2 key={i} className="t-h1 pt-6 text-ink">{block.slice(3)}</h2>
        : block.startsWith("> ") ? <blockquote key={i} className="t-h1 my-12 border-l-2 border-ink pl-6 text-ink">{block.slice(2)}</blockquote>
        : <p key={i} className="whitespace-pre-line">{block}</p>,
      )}
    </div>
  );
}

export function ArticleView({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const minutes = post.readingMinutes ?? Math.max(1, Math.round(post.body.split(/\s+/).length / 220));
  return (
    <article className="pb-24 pt-10">
      <header className="container-x max-w-5xl py-10 text-center lg:py-16">
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-meta text-ink-soft hover:text-ink"><ArrowLeftIcon className="size-4" />{c.back}</Link>
        {post.category && <p className="t-overline mt-6">{post.category.name}</p>}
        <h1 className="t-display mt-4">{post.title}</h1>
        {post.excerpt && <p className="mx-auto mt-6 max-w-xl text-body-lg text-ink-soft">{post.excerpt}</p>}
        <p className="t-index mt-6 text-ink-soft">{post.author} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {c.minRead(minutes)}</p>
      </header>
      {post.cover && (
        <div className="container-x">
          <div className="relative mx-auto aspect-[4/3] max-w-6xl overflow-hidden rounded-xl bg-surface-2 sm:aspect-[16/9]">
            <Image src={post.cover.url} alt={post.cover.alt} fill preload sizes="(min-width: 1440px) 1152px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="container-x mt-14">
        <div className="mx-auto max-w-[68ch]">
          <RichText text={post.body} />
          {post.tags.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
              {post.tags.map((t) => <li key={t} className="rounded-pill border border-line px-3 py-1 text-meta text-ink-soft">{t}</li>)}
            </ul>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related-h" className="container-x mt-24">
          <div className="mb-10 grid gap-3 border-t border-line pt-12">
            <p className="t-overline">{c.relatedOverline}</p>
            <h2 id="related-h" className="t-display">{c.related}</h2>
          </div>
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <li key={p.id}><ArticleCard post={p} /></li>)}</ul>
        </section>
      )}
    </article>
  );
}
