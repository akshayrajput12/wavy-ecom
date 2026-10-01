"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { adminCopy } from "@/data/copy";
import type { AdminBlogPost } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";

const cols: Column<AdminBlogPost>[] = [
  { key: "title", header: "Title", sort: (p) => p.title, cell: (p) => <Link href={`/admin/blog/${p.slug}/edit`} className="font-medium underline-offset-4 hover:underline">{p.title}</Link> },
  { key: "status", header: "Status", sort: (p) => p.status, cell: (p) => <StatusBadge status={p.status} /> },
  { key: "author", header: "Author", cell: (p) => p.authorName },
  { key: "tags", header: "Tags", cell: (p) => p.tags.join(", ") || "None" },
  { key: "updated", header: "Updated", sort: (p) => p.updatedAt, cell: (p) => formatDateTime(p.updatedAt) },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (p) => <RemoveButton compact noun="blog" ids={[p.id]} name={p.title} /> },
];

export function BlogView({ posts }: { posts: AdminBlogPost[] }) {
  const canDelete = useCanRemove("blog");
  return (
    <>
      <PageHeader title="Journal" description="Articles shown on the storefront journal." actions={<ButtonLink href="/admin/blog/new">New post</ButtonLink>} />
      <DataTable caption="Blog posts" rows={posts} columns={cols} getId={(p) => p.id} search={(p) => `${p.title} ${p.slug}`} searchPlaceholder="Search posts"
        bulkActions={canDelete ? [bulkDelete("blog")] : undefined}
        filters={[{ key: "status", label: "Status", options: ["draft", "scheduled", "published", "archived"].map((s) => ({ value: s, label: s })), match: (p, v) => p.status === v }]}
        empty={{ title: "No posts yet", action: <ButtonLink href="/admin/blog/new" size="sm">Write the first post</ButtonLink> }} />
    </>
  );
}
