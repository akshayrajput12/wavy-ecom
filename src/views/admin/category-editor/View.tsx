"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Select } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { CategorySchema } from "@/backend/admin/schemas/catalog";
import type { AdminCategory } from "@/types/admin";
import { mutate } from "../api";
import { DeleteZone, EditorFrame } from "./EditorFrame";
import { EntityFields, type BaseForm } from "./EntityFields";
import { dirtyKey, fieldErrors, nul, resolveImg, serverErrors, toImgs } from "./shared";

type Form = BaseForm & { parentId: string };
type Flat = { id: string; name: string; slug: string; depth: number };

const flatten = (nodes: AdminCategory[], skip: string | undefined, depth = 0): Flat[] =>
  nodes.flatMap((n) => (n.id === skip ? [] : [{ id: n.id, name: n.name, slug: n.slug, depth }, ...flatten(n.children, skip, depth + 1)]));

const opts = (list: Flat[]) => list.map((o) => <option key={o.id} value={o.id}>{`${"— ".repeat(o.depth)}${o.name}`}</option>);

export function CategoryEditorView({ category, tree }: { category: AdminCategory | null; tree: AdminCategory[] }) {
  const router = useRouter();
  const isNew = !category;
  const initial = useMemo<Form>(() => ({
    name: category?.name ?? "", slug: category?.slug ?? "", description: category?.description ?? "",
    image: toImgs(category?.imageUrl, category?.imageAlt), banner: toImgs(category?.bannerUrl, category?.bannerAlt),
    isActive: category?.isActive ?? true, showOnHome: category?.showOnHome ?? false,
    seoTitle: category?.seoTitle ?? "", seoDescription: category?.seoDescription ?? "", parentId: category?.parentId ?? "",
  }), [category]);
  const [saved, setSaved] = useState(dirtyKey(initial));
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reassign, setReassign] = useState("");
  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const dirty = dirtyKey(form) !== saved;

  // flatten() skips the category and its whole subtree, so a cycle can't be picked.
  const parents = useMemo(() => flatten(tree, category?.id), [tree, category]);

  const save = async () => {
    const base = {
      name: form.name.trim(), slug: form.slug.trim(), parentId: form.parentId || null, description: nul(form.description),
      isActive: form.isActive, showOnHome: form.showOnHome, seoTitle: nul(form.seoTitle), seoDescription: nul(form.seoDescription),
    };
    const parsed = CategorySchema.safeParse(base);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const [img, ban] = [await resolveImg(form.image, "category-media"), await resolveImg(form.banner, "category-media")];
    if (!img || !ban) return setSaving(false);
    const body = { ...parsed.data, imageUrl: img.url, imageAlt: img.alt || null, bannerUrl: ban.url, bannerAlt: ban.alt || null };
    const res = await mutate<AdminCategory>(isNew ? "POST" : "PATCH", isNew ? "categories" : `categories/${category.slug}`, body, { success: isNew ? "Category created" : "Category updated" });
    setSaving(false);
    if (!res.ok) return setErrors(serverErrors(res.details));
    setSaved(dirtyKey(form));
    if (isNew || body.slug !== category.slug) router.replace(`/admin/categories/${body.slug}/edit`);
    else router.refresh();
  };

  const remove = async () => {
    if (!category) return;
    setBusy(true);
    const target = parents.find((o) => o.id === reassign)?.slug;
    const res = await mutate("DELETE", `categories/${category.slug}${target ? `?reassignTo=${target}` : ""}`, undefined, { success: "Category deleted" });
    setBusy(false);
    if (res.ok) { router.push("/admin/categories"); router.refresh(); }
  };

  return (
    <EditorFrame title={isNew ? "New category" : `Edit ${category.name}`} isNew={isNew} dirty={dirty} saving={saving} onSave={save} backHref="/admin/categories">
      <EntityFields form={form} set={set} errors={errors} isNew={isNew} basePath="/collections" />
      <FormSection title="Hierarchy">
        <Select label="Parent category" value={form.parentId} error={errors.parentId} onChange={(e) => set({ parentId: e.target.value })}>
          <option value="">None (top level)</option>
          {opts(parents)}
        </Select>
      </FormSection>
      {category && (
        <DeleteZone noun="category" busy={busy} disabled={category.productCount > 0 && !reassign} onConfirm={remove}>
          <p className="text-body">
            {category.productCount > 0
              ? `${category.productCount} product${category.productCount === 1 ? " is" : "s are"} in this category. Choose where they move before deleting.`
              : "No products use this category."}
            {category.children.length > 0 && ` Its ${category.children.length} sub-categories move up one level.`}
          </p>
          {category.productCount > 0 && (
            <Select label="Reassign products to" value={reassign} onChange={(e) => setReassign(e.target.value)}>
              <option value="">Select a category</option>
              {opts(parents)}
            </Select>
          )}
        </DeleteZone>
      )}
    </EditorFrame>
  );
}
