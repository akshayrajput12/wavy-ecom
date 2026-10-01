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

/** Numbered pagination links (crawlable, work without JS) as circular buttons: first, last and a window around the current page. */
export function Pagination({ page, total, pageSize, path, params }: { page: number; total: number; pageSize: number; path: string; params: Params }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const circle = "grid size-11 place-items-center rounded-pill border text-meta font-medium tabular-nums transition-colors duration-(--dur-fast)";
  const idle = "border-line text-ink hover:border-ink";
  const off = "pointer-events-none border-line-soft text-ink-muted";
  return (
    <nav aria-label={c.label} className="mt-16 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={pageHref(path, params, page - 1)} rel="prev" aria-label={c.prev} className={clsx(circle, idle)}><ChevronLeft className="size-4" aria-hidden /></Link>
      ) : <span className={clsx(circle, off)} aria-hidden><ChevronLeft className="size-4" /></span>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - nums[i - 1] > 1 && <span className="t-index text-ink-muted" aria-hidden>…</span>}
          <Link href={pageHref(path, params, n)} aria-current={n === page ? "page" : undefined} aria-label={c.page(n, pages)}
            className={clsx(circle, n === page ? "border-ink bg-ink text-canvas" : idle)}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={pageHref(path, params, page + 1)} rel="next" aria-label={c.next} className={clsx(circle, idle)}><ChevronRight className="size-4" aria-hidden /></Link>
      ) : <span className={clsx(circle, off)} aria-hidden><ChevronRight className="size-4" /></span>}
    </nav>
  );
}
