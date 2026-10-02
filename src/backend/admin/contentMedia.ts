import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { db } from "./_shared";

const BUCKET = "content-media";
const log = logger.child({ svc: "admin.content_media" });
const prefix = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

/** Every content-media object path referenced anywhere in a JSON value (home-section configs nest images in slides). */
export function mediaPaths(v: unknown, out = new Set<string>(), base = prefix()): Set<string> {
  if (typeof v === "string") {
    if (v.startsWith(base)) { const p = decodeURIComponent(v.slice(base.length).split("?")[0]); if (p) out.add(p); }
  } else if (Array.isArray(v)) v.forEach((x) => mediaPaths(x, out, base));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => mediaPaths(x, out, base));
  return out;
}

/** Paths in `before` that `after` no longer references (an image replaced or removed in an edit). */
export const droppedPaths = (before: unknown, after: unknown, base = prefix()): string[] => {
  const keep = mediaPaths(after, new Set(), base);
  return [...mediaPaths(before, new Set(), base)].filter((p) => !keep.has(p));
};

/**
 * Best effort: deletes candidate files that nothing references any more. content-media is shared by home sections,
 * blog posts, content pages and the store logo, so every one of those is checked first (a substring match also catches
 * URLs embedded in markdown bodies). A failed check keeps the files: an orphan is cheaper than a broken image.
 * ponytail: full-table reads; fine at hundreds of rows, switch to a media-usage table if these grow large.
 */
export async function pruneContentMedia(entity: string, candidates: Iterable<string>) {
  const paths = [...new Set(candidates)];
  if (!paths.length) return;
  const c = db() as unknown as SupabaseClient;
  const reads = await Promise.all([
    c.from("home_sections").select("config"),
    c.from("blog_posts").select("*"),
    c.from("content_pages").select("*"),
    c.from("store_settings").select("*"),
  ]);
  const failed = reads.find((r) => r.error);
  if (failed) return log.warn(`${entity}.media_check_failed`, { error: failed.error?.message });
  const used = JSON.stringify(reads.map((r) => r.data));
  const orphans = paths.filter((p) => !used.includes(p));
  if (!orphans.length) return;
  const { error } = await db().storage.from(BUCKET).remove(orphans);
  if (error) log.error(`${entity}.files_delete_failed`, error, { bucket: BUCKET, count: orphans.length });
  else log.info(`${entity}.files_deleted`, { count: orphans.length });
}
