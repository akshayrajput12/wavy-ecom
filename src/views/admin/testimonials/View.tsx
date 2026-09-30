"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { PageHeader } from "@/components/admin/Panel";
import type { AdminTestimonial } from "@/data/admin/types";
import { mutate } from "../api";
import { TestimonialDialog } from "./components/TestimonialDialog";

export function TestimonialsView({ testimonials }: { testimonials: AdminTestimonial[] }) {
  const [items, setItems] = useState(testimonials);
  const [editing, setEditing] = useState<AdminTestimonial | "new" | null>(null);

  const save = (t: AdminTestimonial) => {
    const before = items;
    const exists = items.some((x) => x.id === t.id);
    setItems(exists ? items.map((x) => (x.id === t.id ? t : x)) : [t, ...items]);
    setEditing(null);
    // TODO(backend agent): call /api/admin/testimonials
    void mutate("testimonials", t, { success: exists ? "Testimonial updated" : "Testimonial added", rollback: () => setItems(before) });
  };

  return (
    <>
      <PageHeader title="Testimonials" description="Quotes shown on the home and About pages." actions={<Button size="sm" onClick={() => setEditing("new")}>Add testimonial</Button>} />
      {items.length === 0 ? <EmptyState title="No testimonials" body="Add a customer quote to feature on the storefront." /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-5">
              <blockquote className="flex-1 font-serif text-h3 leading-snug">“{t.quote}”</blockquote>
              <div className="flex items-center justify-between gap-3">
                <p className="text-body"><span className="font-medium">{t.author}</span>{t.role && <span className="t-meta block">{t.role}</span>}</p>
                <StatusBadge status={t.status} />
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(t)} aria-label={`Edit testimonial by ${t.author}`}>Edit</Button>
            </li>
          ))}
        </ul>
      )}
      <TestimonialDialog value={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
