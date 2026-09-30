"use client";

import { Input } from "@/components/ui/Input";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import type { PickOption } from "../collection-editor/ItemPicker";
import { uploadFile } from "../category-editor/shared";

export type Cfg = Record<string, unknown>;
export interface Lookups { categories: PickOption[]; collections: PickOption[]; products: PickOption[] }
/** What every per-type form receives. `files` holds picked-but-not-uploaded images keyed by their blob: URL. */
export interface Ctx { cfg: Cfg; set: (p: Cfg) => void; files: Map<string, File>; lookups: Lookups; errors: Record<string, string> }

export const str = (c: Cfg, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");
export const num = (c: Cfg, k: string) => (typeof c[k] === "number" ? String(c[k]) : "");
export const obj = (c: Cfg, k: string): Cfg => (c[k] && typeof c[k] === "object" && !Array.isArray(c[k]) ? (c[k] as Cfg) : {});
export const ids = (c: Cfg, k: string): string[] => (Array.isArray(c[k]) ? (c[k] as string[]) : []);

/** Drops empty strings/nulls/empty objects so optional config keys are omitted rather than sent blank. */
export function clean(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") {
    const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)]).filter(([, x]) => x !== "" && x != null && !(typeof x === "object" && !Array.isArray(x) && !Object.keys(x as object).length)));
    return out;
  }
  return v;
}

/** Uploads every picked file referenced by a blob: URL anywhere in the config; throws if one fails. */
export async function uploadBlobs(v: unknown, files: Map<string, File>): Promise<unknown> {
  if (typeof v === "string" && v.startsWith("blob:")) {
    const f = files.get(v);
    const url = f && (await uploadFile(f, "content-media"));
    if (!url) throw new Error("upload");
    return url;
  }
  if (Array.isArray(v)) return Promise.all(v.map((x) => uploadBlobs(x, files)));
  if (v && typeof v === "object") return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await uploadBlobs(x, files)])));
  return v;
}

export function Txt({ c, k, label, ...rest }: { c: Ctx; k: string; label: string; type?: string }) {
  const numeric = rest.type === "number";
  return (
    <Input
      label={label} {...rest} value={numeric ? num(c.cfg, k) : str(c.cfg, k)} error={c.errors[`config.${k}`]}
      onChange={(e) => c.set({ [k]: numeric ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value })}
    />
  );
}

export function ImagePick({ files, url, alt, label, error, onChange }: {
  files: Map<string, File>; url: string; alt: string; label: string; error?: string; onChange: (url: string, alt: string) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <ImageDropzone
        label={label} max={1} error={error} value={url ? [{ id: url, url, alt, file: files.get(url) }] : []}
        onChange={(imgs) => {
          const i = imgs[0];
          if (i?.file) files.set(i.url, i.file);
          onChange(i?.url ?? "", i?.alt ?? "");
        }}
      />
    </div>
  );
}

/** label + href pair stored as { label, href }. */
export function CtaFields({ title, value, onChange, error }: { title: string; value: Cfg; onChange: (v: Cfg) => void; error?: string }) {
  return (
    <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <legend className="mb-1 text-meta font-medium">{title}</legend>
      <Input label="Button label" value={str(value, "label")} onChange={(e) => onChange({ ...value, label: e.target.value })} error={error} />
      <Input label="Link" value={str(value, "href")} onChange={(e) => onChange({ ...value, href: e.target.value })} />
    </fieldset>
  );
}
