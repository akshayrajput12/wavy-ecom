"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { adminCopy } from "@/data/copy";
import type { AdminTestimonial } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";

const rc = adminCopy.remove;

const columns: Column<AdminTestimonial>[] = [
  { key: "author", header: "Author", sort: (t) => t.authorName, cell: (t) => <Link href={`/admin/testimonials/${t.id}/edit`} className="font-medium hover:underline">{t.authorName}</Link> },
  { key: "quote", header: "Quote", className: "max-w-md", cell: (t) => <span className="line-clamp-2">{t.quote}</span> },
  { key: "rating", header: "Rating", align: "right", sort: (t) => t.rating ?? 0, cell: (t) => (t.rating ? `${t.rating} / 5` : "-") },
  { key: "order", header: "Order", align: "right", sort: (t) => t.sortOrder, cell: (t) => t.sortOrder },
  { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.isPublished ? "published" : "draft"} /> },
  { key: "actions", header: rc.delete, align: "right", cell: (t) => <RemoveButton compact noun="testimonials" ids={[t.id]} name={`testimonial from ${t.authorName}`} /> },
];

export function TestimonialsView({ testimonials }: { testimonials: AdminTestimonial[] }) {
  const canDelete = useCanRemove("testimonials");
  return (
    <>
      <PageHeader title="Testimonials" description="Customer quotes shown on the storefront." actions={<ButtonLink href="/admin/testimonials/new" size="sm">New testimonial</ButtonLink>} />
      <DataTable caption="Testimonials" rows={testimonials} columns={columns} getId={(t) => t.id} search={(t) => `${t.authorName} ${t.quote}`} searchPlaceholder="Search testimonials"
        bulkActions={canDelete ? [bulkDelete("testimonials")] : undefined}
        filters={[{ key: "status", label: "Status", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }], match: (t, v) => t.isPublished === (v === "published") }]}
        empty={{ title: "No testimonials yet", action: <ButtonLink href="/admin/testimonials/new" size="sm">Add one</ButtonLink> }} />
    </>
  );
}
