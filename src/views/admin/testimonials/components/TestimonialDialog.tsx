"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Select, Textarea } from "@/components/admin/Fields";
import type { AdminTestimonial } from "@/data/admin/types";

export function TestimonialDialog({ value, onClose, onSave }: { value: AdminTestimonial | "new" | null; onClose: () => void; onSave: (t: AdminTestimonial) => void }) {
  return (
    <Dialog open={!!value} onClose={onClose} title={value === "new" ? "Add testimonial" : "Edit testimonial"}>
      {value && <TestimonialForm key={value === "new" ? "new" : value.id} initial={value === "new" ? null : value} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function TestimonialForm({ initial, onClose, onSave }: { initial: AdminTestimonial | null; onClose: () => void; onSave: (t: AdminTestimonial) => void }) {
  const [t, setT] = useState<AdminTestimonial>(() => initial ?? { id: crypto.randomUUID(), author: "", role: "", quote: "", status: "draft" });
  const valid = t.author.trim().length > 1 && t.quote.trim().length > 10;
  return (
    <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (valid) onSave(t); }}>
      <Input label="Author" value={t.author} onChange={(e) => setT({ ...t, author: e.target.value })} autoFocus />
      <Input label="Role or context (optional)" value={t.role ?? ""} onChange={(e) => setT({ ...t, role: e.target.value })} />
      <Textarea label="Quote" value={t.quote} onChange={(e) => setT({ ...t, quote: e.target.value })} hint="Use the customer's exact words." />
      <Select label="Status" value={t.status} onChange={(e) => setT({ ...t, status: e.target.value as AdminTestimonial["status"] })}>
        <option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option>
      </Select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" disabled={!valid}>Save</Button>
      </div>
    </form>
  );
}
