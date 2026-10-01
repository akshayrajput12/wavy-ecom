"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { adminCopy } from "@/data/copy";
import type { AdminFaq } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";
import { FAQ_CATEGORIES } from "./EditorView";

const cols: Column<AdminFaq>[] = [
  { key: "q", header: "Question", sort: (f) => f.question, cell: (f) => <Link href={`/admin/faqs/${f.id}/edit`} className="font-medium underline-offset-4 hover:underline">{f.question}</Link> },
  { key: "category", header: "Category", sort: (f) => f.category, cell: (f) => f.category },
  { key: "order", header: "Order", sort: (f) => f.sortOrder, cell: (f) => f.sortOrder },
  { key: "status", header: "Status", cell: (f) => <Badge tone={f.isPublished ? "success" : "neutral"} dot>{f.isPublished ? "Published" : "Hidden"}</Badge> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (f) => <RemoveButton compact noun="faqs" ids={[f.id]} name={f.question} /> },
];

export function FaqsView({ faqs }: { faqs: AdminFaq[] }) {
  const canDelete = useCanRemove("faqs");
  return (
    <>
      <PageHeader title="FAQs" description="Questions shown on the storefront help pages." actions={<ButtonLink href="/admin/faqs/new">New FAQ</ButtonLink>} />
      <DataTable caption="FAQs" rows={faqs} columns={cols} getId={(f) => f.id} search={(f) => `${f.question} ${f.answer}`} searchPlaceholder="Search FAQs"
        bulkActions={canDelete ? [bulkDelete("faqs")] : undefined}
        filters={[{ key: "category", label: "Category", options: FAQ_CATEGORIES.map((c) => ({ value: c, label: c })), match: (f, v) => f.category === v }]}
        empty={{ title: "No FAQs yet", action: <ButtonLink href="/admin/faqs/new" size="sm">Add a FAQ</ButtonLink> }} />
    </>
  );
}
