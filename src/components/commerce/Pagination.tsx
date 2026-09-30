import Link from "next/link";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationCopy as c } from "@/data/storefront";

type Params = Record<string, string | string[] | undefined>;

/** Rebuilds the current query with a new page (page 1 drops the key). */
export function pageHref(path: string, params: Params, page: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page" || v === undefined) continue;
    for (const one of Array.isArray(v) ? v : [v]) qs.append(k, one);
  }
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Numbered pagination links (crawlable, work without JS). Shows first, last and a window around the current page. */
export function Pagination({ page, total, pageSize, path, params }: { page: number; total: number; pageSize: number; path: string; params: Params }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const item = "grid min-h-11 min-w-11 place-items-center rounded-pill px-3 text-meta font-medium transition-colors";
  return (
    <nav aria-label={c.label} className="mt-14 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && (
        <Link href={pageHref(path, params, page - 1)} rel="prev" className={clsx(item, "gap-1 hover:bg-surface-warm")}>
          <span className="flex items-center gap-1"><ChevronLeft className="size-4" aria-hidden />{c.prev}</span>
        </Link>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-ink-muted" aria-hidden>…</span>}
          <Link href={pageHref(path, params, n)} aria-current={n === page ? "page" : undefined} aria-label={c.page(n, pages)}
            className={clsx(item, n === page ? "bg-ink text-on-dark" : "hover:bg-surface-warm")}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={pageHref(path, params, page + 1)} rel="next" className={clsx(item, "hover:bg-surface-warm")}>
          <span className="flex items-center gap-1">{c.next}<ChevronRight className="size-4" aria-hidden /></span>
        </Link>
      )}
    </nav>
  );
}
