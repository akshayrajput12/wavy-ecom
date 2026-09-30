"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import type { getSeo } from "@/backend/admin/repo";
import type { SeoOverride } from "@/data/admin/types";
import { mutate } from "../api";
import { OverrideDialog } from "./components/OverrideDialog";
import { RedirectsPanel } from "./components/RedirectsPanel";
import { SitemapPanel } from "./components/SitemapPanel";

type Data = Awaited<ReturnType<typeof getSeo>>;

export function SeoView({ data }: { data: Data }) {
  const [rows, setRows] = useState(data.overrides);
  const [editing, setEditing] = useState<SeoOverride | "new" | null>(null);

  const save = (o: SeoOverride) => {
    const before = rows;
    const exists = rows.some((r) => r.id === o.id);
    setRows(exists ? rows.map((r) => (r.id === o.id ? o : r)) : [...rows, o]);
    setEditing(null);
    // TODO(backend agent): call /api/admin/seo/overrides (generateMetadata reads these per route)
    void mutate("seo/overrides", o, { success: `SEO saved for ${o.route}`, rollback: () => setRows(before) });
  };

  const columns: Column<SeoOverride>[] = [
    { key: "route", header: "Route", sort: (o) => o.route, cell: (o) => <button type="button" className="font-mono text-meta font-medium hover:underline" onClick={() => setEditing(o)}>{o.route}</button> },
    { key: "title", header: "Title", cell: (o) => <span className="line-clamp-1">{o.title}</span> },
    { key: "desc", header: "Description", className: "max-w-sm", cell: (o) => <span className="t-meta line-clamp-2">{o.description || "—"}</span> },
    { key: "index", header: "Indexing", cell: (o) => (o.noindex ? <Badge tone="warning" dot>noindex</Badge> : <Badge tone="success" dot>index</Badge>) },
  ];

  return (
    <>
      <PageHeader title="SEO" description="Per-route metadata overrides, sitemap, robots.txt and redirects. Product and journal SEO live in their editors."
        actions={<Button size="sm" onClick={() => setEditing("new")}>Add override</Button>} />
      <DataTable caption="Route SEO overrides" rows={rows} columns={columns} getId={(o) => o.id} search={(o) => `${o.route} ${o.title}`} searchPlaceholder="Search routes" />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SitemapPanel settings={data.settings} />
        <RedirectsPanel redirects={data.redirects} />
      </div>
      <OverrideDialog value={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
