"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CollectionSchema } from "@/backend/admin/schemas/catalog";
import { FormSection } from "@/components/admin/Panel";
import type { AdminCollectionDetail } from "@/types/admin";
import { mutate } from "../api";
import { DeleteZone, EditorFrame } from "../category-editor/EditorFrame";
import { EntityFields, ScheduleFields, type BaseForm } from "../category-editor/EntityFields";
import { dirtyKey, fieldErrors, fromLocal, nul, resolveImg, serverErrors, toImgs, toLocal } from "../category-editor/shared";
import { ItemPicker, type PickOption } from "./ItemPicker";

type Form = BaseForm & { startsAt: string; endsAt: string; productIds: string[] };

export function CollectionEditorView({ collection, products }: { collection: AdminCollectionDetail | null; products: PickOption[] }) {
  const router = useRouter();
  const isNew = !collection;
  const initial = useMemo<Form>(() => ({
    name: collection?.name ?? "", slug: collection?.slug ?? "", description: collection?.description ?? "",
    image: toImgs(collection?.imageUrl, collection?.imageAlt), banner: toImgs(collection?.bannerUrl, collection?.bannerAlt),
    isActive: collection?.isActive ?? true, showOnHome: collection?.showOnHome ?? false,
    seoTitle: collection?.seoTitle ?? "", seoDescription: collection?.seoDescription ?? "",
    startsAt: toLocal(collection?.startsAt), endsAt: toLocal(collection?.endsAt),
    productIds: collection?.products.map((p) => p.productId) ?? [],
  }), [collection]);
  const [saved, setSaved] = useState(dirtyKey(initial));
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const dirty = dirtyKey(form) !== saved;
  // Names for products already in the collection may not be in the options list (e.g. archived).
  const pickable = useMemo(() => {
    const known = new Set(products.map((p) => p.id));
    return [...products, ...(collection?.products ?? []).filter((p) => !known.has(p.productId)).map((p) => ({ id: p.productId, label: p.name }))];
  }, [products, collection]);

  const save = async () => {
    const base = {
      name: form.name.trim(), slug: form.slug.trim(), description: nul(form.description), isActive: form.isActive, showOnHome: form.showOnHome,
      seoTitle: nul(form.seoTitle), seoDescription: nul(form.seoDescription), startsAt: fromLocal(form.startsAt), endsAt: fromLocal(form.endsAt),
    };
    const parsed = CollectionSchema.safeParse(base);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const img = await resolveImg(form.image, "collection-media");
    const ban = img && await resolveImg(form.banner, "collection-media");
    if (!img || !ban) return setSaving(false);
    const body = { ...parsed.data, imageUrl: img.url, imageAlt: img.alt || null, bannerUrl: ban.url, bannerAlt: ban.alt || null };
    const res = await mutate(isNew ? "POST" : "PATCH", isNew ? "collections" : `collections/${collection.slug}`, body, { success: isNew ? "Collection created" : "Collection updated" });
    if (!res.ok) { setSaving(false); return setErrors(serverErrors(res.details)); }
    // Product membership: PUT sets the full order; an empty list can't be PUT, so remove the previous members instead.
    const before = initial.productIds;
    const same = before.join() === form.productIds.join();
    const path = `collections/${body.slug}/products`;
    const members = same ? null
      : form.productIds.length ? await mutate("PUT", path, { productIds: form.productIds }, { success: "Products updated" })
      : before.length ? await mutate("DELETE", path, { productIds: before }, { success: "Products removed" }) : null;
    setSaving(false);
    if (members && !members.ok) return;
    setSaved(dirtyKey(form));
    if (isNew || body.slug !== collection.slug) router.replace(`/admin/collections/${body.slug}/edit`);
    else router.refresh();
  };

  const remove = async () => {
    if (!collection) return;
    setBusy(true);
    const res = await mutate("DELETE", `collections/${collection.slug}`, undefined, { success: "Collection deleted" });
    setBusy(false);
    if (res.ok) { router.push("/admin/collections"); router.refresh(); }
  };

  return (
    <EditorFrame title={isNew ? "New collection" : `Edit ${collection.name}`} isNew={isNew} dirty={dirty} saving={saving} onSave={save} backHref="/admin/collections">
      <EntityFields form={form} set={set} errors={errors} isNew={isNew} basePath="/collections" />
      <FormSection title="Schedule" description="Leave empty to keep it live whenever active.">
        <ScheduleFields startsAt={form.startsAt} endsAt={form.endsAt} error={errors.endsAt} onChange={set} />
      </FormSection>
      <FormSection title="Products" description="Storefront order follows this list.">
        <ItemPicker label="Products" options={pickable} value={form.productIds} onChange={(productIds) => set({ productIds })} />
      </FormSection>
      {collection && (
        <DeleteZone noun="collection" busy={busy} onConfirm={remove}>
          <p className="text-body">Deleting this collection detaches its {collection.productCount} product{collection.productCount === 1 ? "" : "s"}. The products themselves are not deleted.</p>
        </DeleteZone>
      )}
    </EditorFrame>
  );
}
