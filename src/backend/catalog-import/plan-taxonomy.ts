import "server-only";
import type { z } from "zod";
import { CategorySchema, CollectionSchema } from "@/backend/admin/schemas/catalog";
import { createsCycle, SLUG_RE } from "@/backend/admin/schemas/rules";
import { slugify } from "@/lib/format";
import { headerOf, type ImportIssue, SHEETS, type SheetKey } from "./columns";
import type { DbCategory, DbCollection } from "./repo";
import type { At, CategoryRow, CollectionRow } from "./schema";

export type Err = (sheet: SheetKey, row: number, column: string, message: string) => void;
export const errSink = (list: ImportIssue[]): Err => (sheet, row, column, message) =>
  list.push({ sheet: SHEETS[sheet].name, row, column: headerOf(sheet, column), message });

/** File row slug: the Slug column, else made from the name. */
export const slugOf = (r: { slug?: string; name: string }) => (r.slug ?? slugify(r.name)).trim().toLowerCase();

type Entry = { id: string; slug: string; name: string };
/** Ref by slug, else by unique (case-insensitive) name. Returns the entry or an error message. */
export function resolver(label: string, entries: Entry[]) {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));   // later entries (file rows) win
  const byName = new Map<string, string[]>();
  for (const e of bySlug.values()) byName.set(e.name.toLowerCase(), [...(byName.get(e.name.toLowerCase()) ?? []), e.slug]);
  return (ref: string): Entry | string => {
    const r = ref.trim().toLowerCase();
    const names = byName.get(r) ?? [];
    return bySlug.get(r) ?? (names.length === 1 ? bySlug.get(names[0])! : names.length
      ? `"${ref}" matches more than one ${label} (${names.join(", ")}): use the slug` : `Unknown ${label} "${ref}"`);
  };
}

export interface Planned<R> { id: string; slug: string; name: string; isNew: boolean; changed: boolean; row: R; at: number }

/** Slug, in-file duplicates, cross-table slug clash, existing match. */
function index<R extends { slug?: string; name: string; row: number }, E extends { id: string; slug: string }>(
  sheet: SheetKey, rows: R[], existing: E[], clash: Set<string>, clashWith: string, err: Err,
) {
  const bySlug = new Map(existing.map((e) => [e.slug, e]));
  const seen = new Map<string, number>();
  return rows.flatMap((r) => {
    const slug = slugOf(r);
    const col = r.slug ? "slug" : "name";
    if (!SLUG_RE.test(slug)) return err(sheet, r.row, col, r.slug ? "Use lowercase letters, numbers and single hyphens" : "Can't make a slug from this name: fill in Slug"), [];
    if (seen.has(slug)) return err(sheet, r.row, col, `Same slug "${slug}" as row ${seen.get(slug)}`), [];
    seen.set(slug, r.row);
    if (clash.has(slug)) return err(sheet, r.row, col, `Slug "${slug}" is already used by a ${clashWith}`), [];
    const ex = bySlug.get(slug);
    return [{ r, slug, ex, id: ex?.id ?? crypto.randomUUID() }];
  });
}

export const schemaErrors = (sheet: SheetKey, row: number, err: Err, res: z.ZodSafeParseResult<unknown>, rename: Record<string, string> = {}) => {
  if (!res.success) for (const i of res.error.issues) err(sheet, row, rename[String(i.path[0])] ?? String(i.path[0] ?? ""), i.message);
  return res.success;
};

export function planCategories(rows: At<CategoryRow>[], existing: DbCategory[], collectionSlugs: Set<string>, err: Err) {
  const items = index("categories", rows, existing, collectionSlugs, "collection", err);
  const resolve = resolver("category", [...existing, ...items.map((i) => ({ id: i.id, slug: i.slug, name: i.r.name }))]);
  const parents = new Map<string, string | null>(existing.map((c) => [c.id, c.parent_id]));
  const parentOf = new Map<string, string>();
  for (const i of items) {
    if (!i.r.parent) continue;
    const p = resolve(i.r.parent);
    if (typeof p === "string") err("categories", i.r.row, "parent", p);
    else { parentOf.set(i.id, p.id); parents.set(i.id, p.id); }
  }
  const planned: Planned<Record<string, unknown>>[] = [];
  for (const { r, slug, ex, id } of items) {
    const parentId = parentOf.get(id) ?? ex?.parent_id ?? null;
    if (parentOf.has(id) && createsCycle(parents, id, parentId)) { err("categories", r.row, "parent", "A category can't sit under itself or its own sub-category"); continue; }
    const final = {
      name: r.name, slug, parentId, description: r.description ?? ex?.description ?? null,
      showOnHome: r.showOnHome ?? ex?.show_on_home ?? false, sortOrder: r.sortOrder ?? ex?.sort_order ?? 0,
    };
    if (!schemaErrors("categories", r.row, err, CategorySchema.safeParse(final), { parentId: "parent" })) continue;
    const changed = !ex || ex.name !== final.name || ex.parent_id !== parentId || ex.description !== final.description
      || ex.show_on_home !== final.showOnHome || ex.sort_order !== final.sortOrder;
    planned.push({
      id, slug, name: r.name, isNew: !ex, changed, at: r.row,
      row: { name: final.name, slug, parent_id: parentId, description: final.description, show_on_home: final.showOnHome, sort_order: final.sortOrder },
    });
  }
  return { planned: parentsFirst(planned), resolve };
}

/** New parents must exist before their children are written. */
function parentsFirst<T extends Planned<Record<string, unknown>>>(items: T[]): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: T[] = [], done = new Set<string>();
  const visit = (i: T) => {
    if (done.has(i.id)) return;
    done.add(i.id);
    const p = byId.get(String(i.row.parent_id));
    if (p) visit(p);
    out.push(i);
  };
  items.forEach(visit);
  return out;
}

export function planCollections(rows: At<CollectionRow>[], existing: DbCollection[], categorySlugs: Set<string>, err: Err) {
  const items = index("collections", rows, existing, categorySlugs, "category", err);
  const planned: Planned<Record<string, unknown>>[] = [];
  const refs: { collectionId: string; ref: string; at: number }[] = [];
  for (const { r, slug, ex, id } of items) {
    const final = { name: r.name, slug, description: r.description ?? ex?.description ?? null, isActive: r.active ?? ex?.is_active ?? true };
    if (!schemaErrors("collections", r.row, err, CollectionSchema.safeParse(final), { isActive: "active" })) continue;
    const changed = !ex || ex.name !== final.name || ex.description !== final.description || ex.is_active !== final.isActive;
    planned.push({ id, slug, name: r.name, isNew: !ex, changed, at: r.row, row: { name: r.name, slug, description: final.description, is_active: final.isActive } });
    for (const ref of r.products ?? []) refs.push({ collectionId: id, ref, at: r.row });
  }
  const resolve = resolver("collection", [...existing, ...planned.map((p) => ({ id: p.id, slug: p.slug, name: p.name }))]);
  return { planned, refs, resolve };
}
