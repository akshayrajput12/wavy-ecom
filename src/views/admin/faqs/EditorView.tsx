"use client";

import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { FaqSchema } from "@/backend/admin/schemas/content";
import type { AdminFaq } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export const FAQ_CATEGORIES = ["general", "orders", "shipping", "returns", "payments", "products", "account"] as const;

export function FaqEditorView({ faq }: { faq: AdminFaq | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    category: faq?.category ?? "general", question: faq?.question ?? "", answer: faq?.answer ?? "",
    sortOrder: String(faq?.sortOrder ?? 0), isPublished: faq?.isPublished ?? true,
  }, { schema: FaqSchema, back: "/admin/faqs" });
  const submit = () => save(faq ? "PATCH" : "POST", faq ? `faqs/${faq.id}` : "faqs",
    { category: v.category, question: v.question, answer: v.answer, sortOrder: Number(v.sortOrder) || 0, isPublished: v.isPublished },
    faq ? "FAQ saved" : "FAQ created");
  return (
    <>
      <BackLink href="/admin/faqs">All FAQs</BackLink>
      <PageHeader title={faq ? "Edit FAQ" : "New FAQ"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/faqs" danger={faq && <DeleteButton busy={busy} onConfirm={() => void remove(`faqs/${faq.id}`, "FAQ deleted")} />}>
        <Panel>
          <div className="grid gap-4">
            <Select label="Category" value={v.category} error={errors.category} onChange={(e) => set("category", e.target.value as typeof v.category)}>
              {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Question" value={v.question} error={errors.question} onChange={(e) => set("question", e.target.value)} />
            <Textarea label="Answer" className="min-h-40" value={v.answer} error={errors.answer} onChange={(e) => set("answer", e.target.value)} />
            <Input label="Sort order" type="number" hint="Lower numbers show first" value={v.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />Published</label>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
