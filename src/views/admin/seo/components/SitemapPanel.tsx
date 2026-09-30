"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea, Toggle } from "@/components/admin/Fields";
import { Panel } from "@/components/admin/Panel";
import type { SeoSettings } from "@/data/admin/types";
import { mutate } from "../../api";

const SECTIONS = ["Products", "Collections", "Journal", "Pages"];

export function SitemapPanel({ settings }: { settings: SeoSettings }) {
  const [s, setS] = useState(settings);
  const toggleSection = (name: string, on: boolean) =>
    setS({ ...s, sitemapIncludes: on ? [...s.sitemapIncludes, name] : s.sitemapIncludes.filter((x) => x !== name) });
  return (
    <Panel title="Sitemap & robots" actions={
      // TODO(backend agent): call /api/admin/seo/settings (app/sitemap.ts + app/robots.ts read these)
      <Button size="sm" variant="secondary" onClick={() => void mutate("seo/settings", s, { success: "Sitemap & robots saved" })}>Save</Button>
    }>
      <div className="grid gap-4">
        <Toggle label="Generate sitemap.xml" checked={s.sitemapEnabled} onChange={(v) => setS({ ...s, sitemapEnabled: v })} />
        <fieldset disabled={!s.sitemapEnabled} className="flex flex-wrap gap-4 disabled:opacity-50">
          <legend className="mb-2 text-meta font-medium">Include</legend>
          {SECTIONS.map((name) => (
            <label key={name} className="flex items-center gap-2 text-body">
              <input type="checkbox" className="size-4 accent-ink" checked={s.sitemapIncludes.includes(name)} onChange={(e) => toggleSection(name, e.target.checked)} />{name}
            </label>
          ))}
        </fieldset>
        <Textarea label="robots.txt" className="min-h-40 font-mono text-meta" value={s.robotsTxt} onChange={(e) => setS({ ...s, robotsTxt: e.target.value })}
          hint="/admin, /checkout and /account are always disallowed." />
      </div>
    </Panel>
  );
}
