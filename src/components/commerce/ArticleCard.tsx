import Link from "next/link";
import { clsx } from "clsx";
import { formatDate } from "@/lib/format";
import { blogCopy } from "@/data/copy";
import type { BlogPost } from "@/types/domain";
import { ImageWell } from "./ImageWell";

/** Blog teaser used on home and the blog index. */
export function ArticleCard({ post, large, className }: { post: BlogPost; large?: boolean; className?: string }) {
  return (
    <article className={clsx("group h-full", className)}>
      <Link href={`/blog/${post.slug}`} className="block h-full rounded-lg focus-visible:outline-offset-4">
        <ImageWell media={post.cover} alt={post.cover?.alt ?? ""} sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 90vw"}
          className={clsx("rounded-lg", large ? "aspect-[16/10]" : "aspect-[3/2]")}
          imgClassName="transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.04]" />
        <p className="t-overline mt-4 text-ink-soft">
          {post.category && <>{post.category.name} · </>}
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.readingMinutes ? <> · {blogCopy.minRead(post.readingMinutes)}</> : null}
        </p>
        <h3 className={clsx("mt-2 text-balance decoration-line underline-offset-4 group-hover:underline", large ? "t-display" : "t-h3")}>{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 max-w-prose text-body text-ink-soft">{post.excerpt}</p>}
      </Link>
    </article>
  );
}
