import { z } from "zod";
import { ImageWell } from "@/components/commerce/ImageWell";
import { Reveal } from "@/components/ui/Reveal";
import type { ContentPage, Faq } from "@/types/domain";
import { RichText } from "@/views/blog/ArticleView";
import { FaqList } from "./components/FaqList";

/** content_pages.blocks (jsonb): unknown block types or malformed blocks are skipped, never thrown. */
const Block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), heading: z.string(), body: z.string().optional(), image: z.string().optional(), imageAlt: z.string().optional() }),
  z.object({ type: z.literal("text"), heading: z.string().optional(), body: z.string() }),
  z.object({ type: z.literal("image"), url: z.string(), alt: z.string().optional().default("") }),
  z.object({ type: z.literal("faq_list") }),
]);
type Block = z.infer<typeof Block>;

export const parseBlocks = (blocks: unknown): Block[] =>
  (Array.isArray(blocks) ? blocks : []).flatMap((b) => { const r = Block.safeParse(b); return r.success ? [r.data] : []; });

function Render({ block: b, faqs, first }: { block: Block; faqs: Faq[]; first: boolean }) {
  switch (b.type) {
    case "hero":
      return (
        <section className="py-10 lg:py-16">
          {first ? <h1 className="t-hero max-w-4xl">{b.heading}</h1> : <h2 className="t-display max-w-3xl">{b.heading}</h2>}
          {b.body && <p className="mt-6 max-w-[60ch] text-body-lg text-ink-soft">{b.body}</p>}
          {b.image && <ImageWell media={{ url: b.image, alt: b.imageAlt ?? "" }} preload={first} sizes="100vw" className="mt-12 aspect-[4/3] rounded-xl sm:aspect-[21/9]" />}
        </section>
      );
    case "text":
      return (
        <Reveal className="max-w-[68ch] border-t border-line py-10">
          {b.heading && <h2 className="t-h1 mb-6">{b.heading}</h2>}
          <RichText text={b.body} />
        </Reveal>
      );
    case "image":
      return <Reveal className="py-6"><ImageWell media={{ url: b.url, alt: b.alt }} sizes="(min-width: 1024px) 1024px, 100vw" className="aspect-[16/9] max-w-5xl rounded-xl" /></Reveal>;
    case "faq_list":
      return <div className="max-w-3xl py-10"><FaqList faqs={faqs} /></div>;
  }
}

export function ContentPageView({ page, faqs = [] }: { page: ContentPage; faqs?: Faq[] }) {
  const blocks = parseBlocks(page.blocks);
  return (
    <div className="container-x pb-24 pt-10">
      {blocks[0]?.type !== "hero" && <h1 className="t-display py-10 lg:py-16">{page.title}</h1>}
      {blocks.map((b, i) => <Render key={i} block={b} faqs={faqs} first={i === 0} />)}
    </div>
  );
}
