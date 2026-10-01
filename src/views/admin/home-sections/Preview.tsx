import Image from "next/image";
import type { HomeSectionType } from "@/types/domain";
import { ids, obj, str, type Cfg, type Lookups } from "./shared";

const names = (all: { id: string; label: string }[], picked: string[]) =>
  picked.map((id) => all.find((o) => o.id === id)?.label ?? id).join(", ");

function summary(type: HomeSectionType, cfg: Cfg, l: Lookups): string {
  const n = typeof cfg.limit === "number" ? ` (up to ${cfg.limit})` : "";
  switch (type) {
    case "category_grid": return `Category grid${n}: ${ids(cfg, "categoryIds").length ? names(l.categories, ids(cfg, "categoryIds")) : "all categories"}`;
    case "collection_rail": return `Collection rail${n}: ${ids(cfg, "collectionIds").length ? names(l.collections, ids(cfg, "collectionIds")) : "all home collections"}`;
    case "product_carousel": return `Product carousel${n}: ${str(cfg, "source").replace("_", " ") || "no source yet"}${cfg.source === "manual" ? ` - ${names(l.products, ids(cfg, "productIds"))}` : ""}`;
    case "floating_showcase": return `Floating showcase: ${names(l.products, ids(cfg, "productIds")) || "no products yet"}`;
    case "testimonials": return `Testimonials${n}`;
    case "blog_rail": return `Latest blog posts${n}${str(cfg, "categorySlug") ? ` in ${str(cfg, "categorySlug")}` : ""}`;
    case "newsletter": return `${str(cfg, "heading") || "Newsletter"}: ${str(cfg, "body")}`;
    case "tear_reveal": return `Tear reveal: "${str(cfg, "word") || "WORD"}" opens onto ${cfg.variant === "image" ? "a photo" : "the tiger"}${str(obj(cfg, "cta"), "label") ? `, then "${str(obj(cfg, "cta"), "label")}"` : ""}`;
    default: return "";
  }
}

/** Rough inline preview: the hero/promo image with its copy, or a one-line summary for list sections. */
export function Preview({ type, cfg, lookups }: { type: HomeSectionType; cfg: Cfg; lookups: Lookups }) {
  const slides = Array.isArray(cfg.slides) ? (cfg.slides as Cfg[]) : [];
  const lead = type === "hero_carousel" ? slides[0] ?? {} : cfg;
  const image = str(lead, "image");
  const showsImage = type === "hero_carousel" || type === "promo_banner";
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-warm" aria-label="Preview">
      {showsImage ? (
        <div className="relative flex min-h-40 items-end p-4">
          {image && <Image src={image} alt={str(lead, "imageAlt")} fill unoptimized sizes="600px" className="object-cover" />}
          <div className={`relative rounded-sm bg-surface/90 p-3 ${image ? "" : "w-full"}`}>
            {str(lead, "eyebrow") && <p className="t-overline">{str(lead, "eyebrow")}</p>}
            <p className="font-serif text-h3">{str(lead, "heading") || "Heading"}</p>
            <p className="t-meta">{str(lead, "body")}</p>
            {str(obj(lead, "cta"), "label") && <p className="mt-1 text-meta font-medium underline">{str(obj(lead, "cta"), "label")}</p>}
            {type === "hero_carousel" && <p className="t-meta mt-1">{slides.length} slide{slides.length === 1 ? "" : "s"}, first shown</p>}
          </div>
        </div>
      ) : <p className="p-4 text-body">{summary(type, cfg, lookups)}</p>}
    </div>
  );
}
