"use client";

import { ImageDropzone, type DropzoneImage } from "@/components/ui/ImageDropzone";
import { Panel } from "@/components/admin/Panel";

export const BRAND_KEYS = ["logoUrl", "logoDarkUrl", "faviconUrl"] as const;
export type BrandKey = (typeof BRAND_KEYS)[number];
export type BrandImages = Record<BrandKey, DropzoneImage[]>;

const FIELDS: Record<BrandKey, { label: string; hint: string }> = {
  logoUrl: { label: "Logo", hint: "Header on light pages, footer, checkout and admin. Transparent PNG or SVG, cropped tight to the mark. A JPEG always sits on a solid box, so the header and footer show the store name instead." },
  logoDarkUrl: { label: "Logo for dark backgrounds", hint: "Light-coloured version on a transparent PNG or SVG, shown over the hero and in the preloader. Without one, the store name shows there." },
  faviconUrl: { label: "Favicon", hint: "Square PNG or SVG, at least 180 × 180. Browser tab and home-screen icon." },
};

/** Store logo, light logo variant and favicon. The parent uploads picked files on save (content-media bucket). */
export function BrandFields({ value, onChange, errors }: {
  value: BrandImages; onChange: (key: BrandKey, imgs: DropzoneImage[]) => void; errors: Record<string, string>;
}) {
  return (
    <Panel title="Brand" description="Without a logo the store shows its name as a wordmark. The store name stays the accessible label.">
      <div className="grid gap-4 lg:grid-cols-3">
        {BRAND_KEYS.map((k) => (
          <ImageDropzone
            key={k} label={FIELDS[k].label} hint={FIELDS[k].hint} error={errors[k]} max={1} maxSizeMb={2}
            accept="image/png,image/svg+xml,image/webp,image/jpeg,image/avif" value={value[k]} onChange={(imgs) => onChange(k, imgs)}
          />
        ))}
      </div>
    </Panel>
  );
}
