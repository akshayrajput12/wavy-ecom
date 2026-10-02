"use client";

import type { ZodError } from "zod";
import { Input } from "@/components/ui/Input";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { adminCopy } from "@/data/copy";
import type { PickOption } from "../collection-editor/ItemPicker";
import { uploadFile } from "../category-editor/shared";

export type Cfg = Record<string, unknown>;
/** `parents` = top-level categories (departments), a subset of `categories`. */
export interface Lookups { categories: PickOption[]; parents: PickOption[]; collections: PickOption[]; products: PickOption[] }
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

type Issue = ZodError["issues"][number];
const m = adminCopy.homeSections;
/** Plain-language field message for a config issue (zod's defaults read "Invalid input: expected string…"). */
function issueMessage(i: Issue): string {
  if (/alt$/i.test(String(i.path.at(-1) ?? "")) && (i.code === "invalid_type" || i.code === "too_small")) return m.altRequired;
  if (/image$/i.test(String(i.path.at(-1) ?? "")) && (i.code === "invalid_type" || i.code === "too_small")) return m.imageRequired;
  switch (i.code) {
    case "invalid_type": case "invalid_value": return m.required; // clean() drops blanks, so a blank field arrives missing
    case "too_small": return i.origin === "array" ? m.addOne : i.origin === "string" ? m.required : m.min(i.minimum);
    case "too_big": return i.origin === "string" ? m.maxChars(i.maximum) : m.max(i.maximum);
    default: return i.message;
  }
}
/** Zod issues to { "config.slides.0.heading": message }; the first issue per field wins. */
export const configErrors = (e: ZodError): Record<string, string> =>
  Object.fromEntries([...e.issues].reverse().map((i) => [["config", ...i.path].join("."), issueMessage(i)]));

/** Error line for controls that have no error slot of their own (pickers). */
export const Err = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="text-meta text-danger sm:col-span-2">⚠ {msg}</p> : null);

export function Txt({ c, k, label, ...rest }: { c: Ctx; k: string; label: string; type?: string }) {
  const numeric = rest.type === "number";
  return (
    <Input
      label={label} {...rest} value={numeric ? num(c.cfg, k) : str(c.cfg, k)} error={c.errors[`config.${k}`]}
      onChange={(e) => c.set({ [k]: numeric ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value })}
    />
  );
}

/** File name to a readable alt-text starting point: no extension, separators or leading number/hero/img prefixes. */
export const altFromFile = (name: string) =>
  name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/^(?:(?:hero|img|image|photo|dsc|\d+)\s+)+/i, "").replace(/\s+\d+$/, "").trim();

export function ImagePick({ files, url, alt, label, error, onChange }: {
  files: Map<string, File>; url: string; alt: string; label: string; error?: string; onChange: (url: string, alt: string) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <ImageDropzone
        label={label} max={1} error={error} value={url ? [{ id: url, url, alt, file: files.get(url) }] : []}
        onChange={(imgs) => {
          const i = imgs[0];
          if (i?.url !== url) files.delete(url); // replaced or removed: drop the stale pick
          if (i?.file) files.set(i.url, i.file);
          // a fresh pick with no alt text yet gets one from its file name ("hero-03-leather-tote.png" -> "leather tote")
          onChange(i?.url ?? "", i?.alt || (i?.file ? altFromFile(i.file.name) : ""));
        }}
      />
    </div>
  );
}

/** label + href pair stored as { label, href }. */
export function CtaFields({ title, value, onChange, error, hrefError }: {
  title: string; value: Cfg; onChange: (v: Cfg) => void; error?: string; hrefError?: string;
}) {
  return (
    <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
      <legend className="mb-1 text-meta font-medium">{title}</legend>
      <Input label="Button label" value={str(value, "label")} onChange={(e) => onChange({ ...value, label: e.target.value })} error={error} />
      <Input label="Link" value={str(value, "href")} onChange={(e) => onChange({ ...value, href: e.target.value })} error={hrefError} />
    </fieldset>
  );
}
