import Link from "next/link";
import { ImageWell } from "@/components/commerce/ImageWell";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { blogCopy } from "@/data/copy";
import { homeCopy } from "@/data/storefront";
import { formatDate } from "@/lib/format";
import type { BlogPost, HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

function PostCard({ post: p }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${p.slug}`} className="group block rounded-lg focus-visible:outline-offset-4">
      <ImageWell media={p.cover} alt="" sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 92vw" className="aspect-[4/3] rounded-lg"
        imgClassName="transition-[scale] duration-(--dur-slow) ease-out group-hover:scale-[1.06] group-focus-visible:scale-[1.06]" />
      <p className="t-overline mt-4">
        {p.category && <>{p.category.name} · </>}
        {p.publishedAt && <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>}
        {p.readingMinutes ? <> · {blogCopy.minRead(p.readingMinutes)}</> : null}
      </p>
      <h3 className="t-h2 mt-2 text-balance decoration-1 underline-offset-4 group-hover:underline">{p.title}</h3>
      {p.excerpt && <p className="mt-2 line-clamp-2 max-w-prose text-body text-ink-soft">{p.excerpt}</p>}
    </Link>
  );
}

export function BlogRail({ section }: { section: HomeSectionOf<"blog_rail"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead overline={homeCopy.overline.blog} title={section.title ?? blogCopy.title} subtitle={section.subtitle} cta={{ label: homeCopy.viewAll, href: "/blog" }} />
      <Stagger as="ul" className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.posts.slice(0, 3).map((p) => <StaggerItem as="li" key={p.id}><PostCard post={p} /></StaggerItem>)}
      </Stagger>
    </section>
  );
}
