"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { AdminBlogPost } from "@/data/admin/types";

const columns: Column<AdminBlogPost>[] = [
  { key: "title", header: "Title", sort: (p) => p.title, cell: (p) => <Link href={`/admin/blog/${p.id}`} className="hover:underline"><span className="block font-medium">{p.title}</span><span className="t-meta">/journal/{p.slug}</span></Link> },
  { key: "tags", header: "Tags", cell: (p) => <span className="t-meta">{p.tags.join(", ") || "—"}</span> },
  { key: "author", header: "Author", cell: (p) => p.author },
  { key: "date", header: "Publish date", sort: (p) => p.publishAt ?? "", cell: (p) => (p.publishAt ? formatDateTime(p.publishAt) : "—") },
  { key: "seo", header: "SEO", cell: (p) => (p.seo.title && p.seo.description ? "Complete" : <span className="text-warning">Missing fields</span>) },
  { key: "status", header: "Status", sort: (p) => p.status, cell: (p) => <StatusBadge status={p.status === "scheduled" ? "scheduled" : p.status} /> },
];

export function BlogView({ posts }: { posts: AdminBlogPost[] }) {
  return (
    <>
      <PageHeader title="Journal" description="Editorial posts for the storefront journal." actions={<ButtonLink href="/admin/blog/new" size="sm">New post</ButtonLink>} />
      <DataTable caption="Journal posts" rows={posts} columns={columns} getId={(p) => p.id} search={(p) => `${p.title} ${p.tags.join(" ")}`} searchPlaceholder="Search posts"
        filters={[{ key: "status", label: "Status", options: ["draft", "scheduled", "published"].map((s) => ({ value: s, label: s })), match: (p, v) => p.status === v }]}
        empty={{ title: "No posts yet", action: <ButtonLink href="/admin/blog/new" size="sm">Write the first post</ButtonLink> }} />
    </>
  );
}
