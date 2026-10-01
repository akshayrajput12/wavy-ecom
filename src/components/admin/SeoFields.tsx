"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/Input";
import { siteConfig as site } from "@/lib/site";
import { Textarea } from "./Fields";

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** SEO title/description inputs with a live Google result preview. Spread react-hook-form `register()` into the props. */
export function SeoFields({ title, description, path, titleProps, descriptionProps }: {
  title: string; description: string; path: string;
  titleProps: ComponentProps<"input">; descriptionProps: ComponentProps<"textarea">;
}) {
  const host = site.url.replace(/^https?:\/\//, "");
  return (
    <div className="grid gap-4 sm:col-span-2 lg:grid-cols-2">
      <div className="grid gap-4">
        <Input label="SEO title" hint={`${title.length}/60 characters`} {...titleProps} />
        <Textarea label="Meta description" hint={`${description.length}/160 characters`} {...descriptionProps} />
      </div>
      <section aria-label="Google search preview" className="rounded-lg border border-line bg-surface p-4">
        <p className="t-overline mb-2 text-ink-soft" aria-hidden>Search preview</p>
        <p className="truncate text-meta text-ink-soft">{host}{path.split("/").filter(Boolean).map((s) => ` › ${s}`)}</p>
        <p className="mt-0.5 text-body-lg text-info">{cut(title || "Untitled page", 60)}</p>
        <p className="mt-1 text-meta text-ink-soft">{cut(description || "Add a meta description so search engines don't pick random page text.", 160)}</p>
      </section>
    </div>
  );
}
