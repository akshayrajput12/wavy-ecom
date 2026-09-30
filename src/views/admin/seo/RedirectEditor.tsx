"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { RedirectSchema } from "@/backend/admin/schemas/content";
import type { AdminRedirect } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export function RedirectEditorView({ item }: { item: AdminRedirect | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    fromPath: item?.fromPath ?? "/", toPath: item?.toPath ?? "/", statusCode: String(item?.statusCode ?? 301), isActive: item?.isActive ?? true,
  }, { schema: RedirectSchema, back: "/admin/seo" });
  const submit = () => save(item ? "PATCH" : "POST", item ? `redirects/${item.id}` : "redirects",
    { fromPath: v.fromPath, toPath: v.toPath, statusCode: Number(v.statusCode), isActive: v.isActive }, "Redirect saved");
  return (
    <>
      <BackLink href="/admin/seo">SEO</BackLink>
      <PageHeader title={item ? "Edit redirect" : "New redirect"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/seo" danger={item && <DeleteButton busy={busy} onConfirm={() => void remove(`redirects/${item.id}`, "Redirect deleted")} />}>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="From path" value={v.fromPath} error={errors.fromPath} onChange={(e) => set("fromPath", e.target.value)} />
            <Input label="To path or URL" value={v.toPath} error={errors.toPath} onChange={(e) => set("toPath", e.target.value)} />
            <Select label="Type" value={v.statusCode} onChange={(e) => set("statusCode", e.target.value)}>
              <option value="301">301 permanent</option><option value="302">302 temporary</option><option value="307">307 temporary (keep method)</option><option value="308">308 permanent (keep method)</option>
            </Select>
            <label className="flex min-h-11 items-center gap-2 self-end text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />Active</label>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
