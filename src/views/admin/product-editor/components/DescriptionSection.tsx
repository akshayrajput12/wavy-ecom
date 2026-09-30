"use client";

import { useState, type ReactNode } from "react";
import { Textarea } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import type { EditorForm, SetForm } from "./form";

const inline = (t: string): ReactNode[] =>
  t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));

/** Tiny Markdown renderer for the preview: headings, bullet lists, bold, paragraphs (no raw HTML, so it is safe). */
export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/).filter(Boolean);
  if (!blocks.length) return <p className="t-meta">Nothing to preview yet.</p>;
  return (
    <div className="grid gap-3 text-body">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*] /.test(l))) return <ul key={i} className="list-disc pl-5">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ""))}</li>)}</ul>;
        const h = /^(#{1,3}) (.*)/.exec(b);
        if (h) return <p key={i} className="text-body-lg font-semibold">{inline(h[2])}</p>;
        return <p key={i}>{inline(b)}</p>;
      })}
    </div>
  );
}

export function MediaSection({ f, set }: { f: EditorForm; set: SetForm }) {
  return (
    <FormSection title="Media" description="First image is the cover. New files upload when you save.">
      <div className="sm:col-span-2">
        <ImageDropzone label="Product images" value={f.media} onChange={(media) => set({ media, variants: f.variants.map((v) => (media.some((m) => m.id === v.imageId) ? v : { ...v, imageId: null })) })} max={50} />
      </div>
    </FormSection>
  );
}

export function DescriptionSection({ f, set }: { f: EditorForm; set: SetForm }) {
  const [preview, setPreview] = useState(false);
  return (
    <FormSection title="Description" description="Short summary, long Markdown copy and highlights.">
      <Textarea label="Short description" wrapperClassName="sm:col-span-2" maxLength={300} className="min-h-16" value={f.shortDescription}
        hint={`${f.shortDescription.length}/300`} onChange={(e) => set({ shortDescription: e.target.value })} />
      <div className="sm:col-span-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-meta font-medium">Description (Markdown)</span>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)} className="min-h-11 rounded-sm px-3 text-meta underline underline-offset-4">
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        {preview
          ? <div className="min-h-40 rounded-sm border border-line bg-surface-warm p-4"><MarkdownLite text={f.description} /></div>
          : <Textarea label="Description" className="min-h-40 font-mono text-meta" value={f.description} onChange={(e) => set({ description: e.target.value })} aria-label="Description" />}
      </div>
      <Textarea label="Highlights" wrapperClassName="sm:col-span-2" value={f.highlights} onChange={(e) => set({ highlights: e.target.value })} hint="One per line, up to 20" />
    </FormSection>
  );
}
