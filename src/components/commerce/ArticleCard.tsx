import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/types/domain";

/** Journal teaser used on home, editorial and the journal index. */
export function ArticleCard({ post, large, className }: { post: BlogPost; large?: boolean; className?: string }) {
  return (
    <article className={clsx("group", className)}>
      <Link href={`/journal/${post.slug}`} className="block">
        <div className={clsx("relative overflow-hidden rounded-md bg-surface-warm", large ? "aspect-[4/3]" : "aspect-[3/2]")}>
          <Image src={post.cover.url} alt={post.cover.alt} fill sizes={large ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 100vw"} className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        </div>
        <p className="t-overline mt-4 text-ink-soft">{post.tags[0]} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></p>
        <h3 className={clsx("mt-2 font-serif leading-tight text-balance group-hover:underline group-hover:underline-offset-4", large ? "text-display" : "text-h2")}>{post.title}</h3>
        <p className="mt-2 line-clamp-2 max-w-prose text-body text-ink-soft">{post.excerpt}</p>
      </Link>
    </article>
  );
}
