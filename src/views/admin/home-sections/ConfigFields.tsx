"use client";

import { Select } from "@/components/admin/Fields";
import type { HomeSectionType } from "@/types/domain";
import { ItemPicker } from "../collection-editor/ItemPicker";
import { HeroFields } from "./HeroFields";
import { CtaFields, ImagePick, Txt, ids, obj, str, type Ctx } from "./shared";

const SOURCES = ["featured", "new", "best_rated", "collection", "category", "manual"] as const;
const themeSelect = (c: Ctx) => (
  <Select label="Text theme" value={str(c.cfg, "theme")} onChange={(e) => c.set({ theme: e.target.value })}>
    <option value="">Default</option><option value="light">Light</option><option value="dark">Dark</option>
  </Select>
);
const cta = (c: Ctx) => <CtaFields title="Button" value={obj(c.cfg, "cta")} onChange={(v) => c.set({ cta: v })} error={c.errors["config.cta.label"]} />;

/** Per-type config form; the shape mirrors HOME_CONFIG in backend/admin/schemas/content.ts. */
export function ConfigFields({ type, c }: { type: HomeSectionType; c: Ctx }) {
  const { lookups: l } = c;
  switch (type) {
    case "hero_carousel": return <HeroFields c={c} />;
    case "category_grid": return <>
      <ItemPicker label="Categories (empty = all)" options={l.categories} value={ids(c.cfg, "categoryIds")} onChange={(v) => c.set({ categoryIds: v })} max={50} />
      <Txt c={c} k="limit" label="Limit (1 to 24)" type="number" />
    </>;
    case "collection_rail": return <>
      <ItemPicker label="Collections (empty = all on home)" options={l.collections} value={ids(c.cfg, "collectionIds")} onChange={(v) => c.set({ collectionIds: v })} max={50} />
      <Txt c={c} k="limit" label="Limit (1 to 24)" type="number" />
    </>;
    case "product_carousel": {
      const source = str(c.cfg, "source");
      return <>
        <Select label="Products come from" value={source} error={c.errors["config.source"]} onChange={(e) => c.set({ source: e.target.value })}>
          <option value="">Select a source</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </Select>
        {source === "collection" && (
          <Select label="Collection" value={str(c.cfg, "collectionId")} error={c.errors["config.collectionId"]} onChange={(e) => c.set({ collectionId: e.target.value })}>
            <option value="">Select</option>{l.collections.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        )}
        {source === "category" && (
          <Select label="Category" value={str(c.cfg, "categoryId")} error={c.errors["config.categoryId"]} onChange={(e) => c.set({ categoryId: e.target.value })}>
            <option value="">Select</option>{l.categories.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        )}
        {source === "manual" && <ItemPicker label="Products" options={l.products} value={ids(c.cfg, "productIds")} onChange={(v) => c.set({ productIds: v })} max={50} />}
        <Txt c={c} k="limit" label="Limit (1 to 24)" type="number" />
        {cta(c)}
      </>;
    }
    case "floating_showcase": return <>
      <ItemPicker label="Showcase products" options={l.products} value={ids(c.cfg, "productIds")} onChange={(v) => c.set({ productIds: v })} max={50} />
      {c.errors["config.productIds"] && <p className="text-meta text-danger sm:col-span-2">⚠ {c.errors["config.productIds"]}</p>}
      <ImagePick files={c.files} url={str(c.cfg, "image")} alt={str(c.cfg, "imageAlt")} label="Background image (optional)" onChange={(image, imageAlt) => c.set({ image, imageAlt })} />
      {cta(c)}
    </>;
    case "promo_banner": return <>
      <ImagePick files={c.files} url={str(c.cfg, "image")} alt={str(c.cfg, "imageAlt")} label="Banner image" error={c.errors["config.image"]} onChange={(image, imageAlt) => c.set({ image, imageAlt })} />
      <Txt c={c} k="imageAlt" label="Image alt text" />
      <Txt c={c} k="heading" label="Heading" />
      <Txt c={c} k="body" label="Body" />
      <Txt c={c} k="couponCode" label="Coupon code (optional)" />
      {themeSelect(c)}
      {cta(c)}
    </>;
    case "testimonials": return <Txt c={c} k="limit" label="How many to show (1 to 24)" type="number" />;
    case "blog_rail": return <>
      <Txt c={c} k="limit" label="How many posts (1 to 24)" type="number" />
      <Txt c={c} k="categorySlug" label="Blog category slug (optional)" />
    </>;
    case "newsletter": return <>
      <Txt c={c} k="heading" label="Heading" />
      <Txt c={c} k="body" label="Body" />
      <Txt c={c} k="placeholder" label="Email placeholder" />
      <Txt c={c} k="buttonLabel" label="Button label" />
      <Txt c={c} k="consentText" label="Consent text" />
    </>;
    case "tear_reveal": return <>
      <Txt c={c} k="word" label="Word that tears (short, e.g. UNTAMED)" />
      <Txt c={c} k="tagline" label="Tagline above it (optional)" />
      <Select label="Behind the tear" value={str(c.cfg, "variant")} onChange={(e) => c.set({ variant: e.target.value })}>
        <option value="">Tiger illustration</option><option value="image">Photo (full bleed)</option>
      </Select>
      {str(c.cfg, "variant") === "image" && <>
        <ImagePick files={c.files} url={str(c.cfg, "image")} alt={str(c.cfg, "imageAlt")} label="Photo revealed by the tear" error={c.errors["config.image"]} onChange={(image, imageAlt) => c.set({ image, imageAlt })} />
        <Txt c={c} k="imageAlt" label="Image alt text" />
      </>}
      {cta(c)}
    </>;
  }
}
