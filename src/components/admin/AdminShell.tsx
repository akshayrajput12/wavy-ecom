"use client";

import { clsx } from "clsx";
import { ChevronRight, ExternalLink, Lock, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/States";
import type { StaffMember, StaffRole } from "@/data/admin/types";
import { ADMIN_NAV, can, navItemFor, ROLE_LABELS } from "@/views/admin/rbac";
import { setPreviewRole, useRole } from "./useRole";

const humanize = (s: string) => (s === "new" ? "New" : decodeURIComponent(s));

/** Admin chrome: black nav rail (filtered by role) + topbar with breadcrumb + route-level RBAC guard. */
export function AdminShell({ me, children }: { me: Pick<StaffMember, "name" | "email">; children: ReactNode }) {
  const pathname = usePathname();
  const { role, allowPreview } = useRole();
  const [open, setOpen] = useState(false);
  const current = navItemFor(pathname);
  const allowed = !current || can(role, current.permission);
  const extra = current ? pathname.slice(current.href.length).split("/").filter(Boolean) : [];

  return (
    <div className="flex min-h-dvh bg-canvas" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        id="admin-rail"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-black text-on-dark transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin/dashboard" className="text-h3 font-semibold tracking-tight">wavy <span className="t-overline text-on-dark/60">Admin</span></Link>
          <button className="rounded-sm p-2 hover:bg-on-dark/10 lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}><X className="size-5" /></button>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((group) => {
            const items = group.items.filter((i) => can(role, i.permission));
            if (!items.length) return null;
            return (
              <div key={group.label} className="mt-5 first:mt-1">
                <p className="t-overline px-3 pb-1.5 text-on-dark/50">{group.label}</p>
                <ul className="flex flex-col gap-0.5">
                  {items.map(({ href, label, icon: Icon }) => {
                    const active = current?.href === href;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={clsx(
                            "flex min-h-10 items-center gap-3 rounded-sm px-3 text-body transition-colors",
                            active ? "bg-accent font-medium text-ink" : "text-on-dark/75 hover:bg-on-dark/10 hover:text-on-dark",
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />{label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-on-dark/10 px-5 py-4">
          <p className="text-body font-medium">{me.name}</p>
          <p className="t-meta text-on-dark/60">{ROLE_LABELS[role]}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur md:px-6">
          <button
            className="-ml-1 rounded-sm p-2 hover:bg-surface-warm lg:hidden"
            aria-label="Open navigation" aria-expanded={open} aria-controls="admin-rail"
            onClick={() => setOpen(true)}
          ><Menu className="size-5" /></button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex items-center gap-1.5 truncate text-meta text-ink-soft">
              <li><Link href="/admin/dashboard" className="hover:text-ink">Admin</Link></li>
              {current && <Crumb href={current.href} label={current.label} last={!extra.length} />}
              {extra.map((seg, i) => <Crumb key={seg} label={humanize(seg)} last={i === extra.length - 1} />)}
            </ol>
          </nav>
          {allowPreview && (
            <label className="hidden items-center gap-2 text-meta text-ink-soft sm:flex">
              <span>Preview role</span>
              <select
                value={role}
                onChange={(e) => setPreviewRole(e.target.value as StaffRole)}
                className="h-9 rounded-sm border border-line bg-surface px-2 text-meta text-ink"
              >
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </label>
          )}
          <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-line px-3 text-meta hover:border-ink">
            View store <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {allowed ? children : (
            <EmptyState
              icon={<Lock className="size-8" />}
              title="No access"
              body={`Your role (${ROLE_LABELS[role]}) can't open ${current?.label ?? "this page"}. Ask a super admin if you need it.`}
              action={<Link href="/admin/dashboard" className="text-body underline underline-offset-4">Back to dashboard</Link>}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Crumb({ href, label, last }: { href?: string; label: string; last: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <ChevronRight className="size-3.5" aria-hidden />
      {last || !href ? <span aria-current={last ? "page" : undefined} className={clsx(last && "font-medium text-ink")}>{label}</span>
        : <Link href={href} className="hover:text-ink">{label}</Link>}
    </li>
  );
}
