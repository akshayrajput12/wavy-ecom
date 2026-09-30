"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Toggle } from "@/components/admin/Fields";
import { SeoFields } from "@/components/admin/SeoFields";
import type { SeoOverride } from "@/data/admin/types";

export function OverrideDialog({ value, onClose, onSave }: { value: SeoOverride | "new" | null; onClose: () => void; onSave: (o: SeoOverride) => void }) {
  return (
    <Dialog open={!!value} onClose={onClose} title={value === "new" ? "Add SEO override" : `SEO for ${value?.route ?? ""}`}>
      {value && <OverrideForm key={value === "new" ? "new" : value.id} initial={value === "new" ? null : value} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function OverrideForm({ initial, onClose, onSave }: { initial: SeoOverride | null; onClose: () => void; onSave: (o: SeoOverride) => void }) {
  const [o, setO] = useState<SeoOverride>(() => initial ?? { id: crypto.randomUUID(), route: "/", title: "", description: "", noindex: false });
  const routeError = o.route.startsWith("/") ? undefined : "Must start with /";
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (!routeError) onSave(o); }}>
      <Input label="Route" value={o.route} onChange={(e) => setO({ ...o, route: e.target.value.trim() })} error={routeError} disabled={!!initial} />
      <SeoFields title={o.title} description={o.description} path={o.route}
        titleProps={{ value: o.title, onChange: (e) => setO({ ...o, title: e.target.value }) }}
        descriptionProps={{ value: o.description, onChange: (e) => setO({ ...o, description: e.target.value }) }} />
      <Toggle label="Hide from search engines (noindex)" checked={o.noindex} onChange={(noindex) => setO({ ...o, noindex })} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!!routeError}>Save</Button>
      </div>
    </form>
  );
}
