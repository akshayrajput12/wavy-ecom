"use client";

import { clsx } from "clsx";
import { ChevronRight, ExternalLink, Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { IconMotion, MenuIcon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandImage, isCleanLogo } from "@/components/layout/Logo";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/States";
import { adminCopy as c } from "@/data/copy";
import type { StaffRole, StaffSession } from "@/types/admin";
import { can, navItemFor, ROLE_LABELS } from "@/views/admin/rbac";
import { AdminNav } from "./AdminNav";
import { usePersisted } from "./usePersisted";
import { RoleProvider, setPreviewRole, useRole } from "./useRole";

const humanize = (s: string) => (s === "new" ? c.newCrumb : decodeURIComponent(s));
const DRAWER_NAV_ID = "admin-drawer-nav";
const navScroll = "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3 [scrollbar-color:var(--line)_transparent] [scrollbar-width:thin]";

/**
 * Admin chrome. lg+: sticky full-height sidebar (brand + user pinned, only the nav scrolls) that collapses
 * to an icon rail (persisted). <lg: top bar + off-canvas Drawer (native dialog: Esc, focus trap, scroll lock).
 * `me` = current staff session (null when Supabase is not configured; the UI then assumes super_admin, the server still enforces).
 */
export function AdminShell({ me, brand, children }: { me: StaffSession | null; brand?: ShellBrand; children: ReactNode }) {
  return <RoleProvider role={me?.role ?? "super_admin"}><Shell me={me} brand={brand ?? { name: c.brand }}>{children}</Shell></RoleProvider>;
}

/** Store brand from settings (logo; favicon for the collapsed rail). Falls back to the copy wordmark. */
export interface ShellBrand { name: string; logoUrl?: string; iconUrl?: string }

function Shell({ me, brand, children }: { me: StaffSession | null; brand: ShellBrand; children: ReactNode }) {
  const pathname = usePathname();
  const { role, allowPreview } = useRole();
  const [open, setOpen] = useState(false);
  const [railRaw, setRail] = usePersisted("wavy.admin.rail");
  const rail = railRaw === "1";
  const current = navItemFor(pathname);
  const allowed = !current || can(role, current.permission);
  const extra = current ? pathname.slice(current.href.length).split("/").filter(Boolean) : [];
  const name = me?.name ?? me?.email ?? c.staffFallback;

  // Close the drawer on navigation (render-time reset, no effect) and when the viewport reaches lg.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) { setSeenPath(pathname); setOpen(false); }
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const onChange = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside id="admin-sidebar" className={clsx("sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface lg:flex transition-[width] duration-(--dur-base) ease-soft motion-reduce:transition-none", rail ? "w-20" : "w-64")}>
        <div className={clsx("flex h-16 shrink-0 items-center border-b border-line", rail ? "justify-center" : "px-5")}>
          <Brand brand={brand} compact={rail} />
        </div>
        <AdminNav role={role} currentHref={current?.href} rail={rail} className={navScroll} />
        <div className={clsx("flex shrink-0 items-center gap-2 border-t border-line p-3", rail && "flex-col")}>
          <UserCard name={name} role={role} compact={rail} />
          <button
            type="button" onClick={() => setRail(rail ? "0" : "1")}
            aria-expanded={!rail} aria-controls="admin-sidebar" aria-label={rail ? c.expand : c.collapse} title={rail ? c.expand : c.collapse}
            className="grid size-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          ><IconMotion icon={rail ? PanelLeftOpen : PanelLeftClose} className="size-5" /></button>
        </div>
      </aside>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" title={<Brand brand={brand} />}
        footer={<div className="grid gap-3"><UserCard name={name} role={role} />{allowPreview && <RolePreview role={role} />}</div>}>
        <div id={DRAWER_NAV_ID} className="-mx-2">
          <AdminNav role={role} currentHref={current?.href} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:gap-3 md:px-6">
          <button
            type="button" onClick={() => setOpen(true)}
            aria-label={c.openNav} aria-expanded={open} aria-controls={DRAWER_NAV_ID}
            className="grid size-11 shrink-0 place-items-center rounded-pill transition-colors hover:bg-surface-2 lg:hidden"
          ><MenuIcon className="size-5" /></button>
          <nav aria-label={c.breadcrumb} className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1.5 text-meta whitespace-nowrap text-ink-soft">
              <li className="hidden shrink-0 sm:block"><Link href="/admin/dashboard" className="hover:text-ink">{c.root}</Link></li>
              {current && <Crumb href={current.href} label={current.label} last={!extra.length} />}
              {extra.map((seg, i) => <Crumb key={seg} label={humanize(seg)} last={i === extra.length - 1} />)}
            </ol>
          </nav>
          {allowPreview && <div className="hidden md:block"><RolePreview role={role} /></div>}
          <Link href="/" aria-label={c.viewStore} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 text-meta transition-colors hover:border-ink sm:h-9">
            <span className="hidden sm:inline">{c.viewStore}</span><IconMotion icon={ExternalLink} className="size-4" />
          </Link>
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-(--container) min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {allowed ? children : (
            <EmptyState
              icon={<Lock className="size-8" />}
              title={c.noAccess.title}
              body={c.noAccess.body(ROLE_LABELS[role], current?.label ?? c.noAccess.thisPage)}
              action={<Link href="/admin/dashboard" className="text-body underline underline-offset-4">{c.noAccess.cta}</Link>}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Brand({ brand, compact }: { brand: ShellBrand; compact?: boolean }) {
  const src = compact ? brand.iconUrl : isCleanLogo(brand.logoUrl) ? brand.logoUrl : undefined; // JPEG logos carry a solid box
  return (
    <Link href="/admin/dashboard" className="flex min-h-11 min-w-0 items-center gap-2 rounded-pill">
      {src ? <BrandImage src={src} alt={brand.name} className={compact ? "size-9 rounded-sm" : "h-7"} /> : (
        <span className="font-display text-h2 leading-none font-heading-sm tracking-tight text-ink">{compact ? brand.name.charAt(0) : brand.name}</span>
      )}
      {!compact && <span className="t-overline rounded-pill bg-accent-soft px-2 py-0.5 text-accent-deep">{c.brandTag}</span>}
      {compact && <span className="sr-only">{c.brandTag}</span>}
    </Link>
  );
}

function UserCard({ name, role, compact }: { name: string; role: StaffRole; compact?: boolean }) {
  return (
    <div className={clsx("flex min-w-0 items-center gap-3", !compact && "flex-1")} title={compact ? `${name} · ${ROLE_LABELS[role]}` : undefined}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-meta font-semibold text-ink uppercase" aria-hidden>{name.charAt(0)}</span>
      <div className={compact ? "sr-only" : "min-w-0"}>
        <p className="truncate text-body font-medium">{name}</p>
        <p className="truncate text-meta text-ink-soft">{ROLE_LABELS[role]}</p>
      </div>
    </div>
  );
}

function RolePreview({ role }: { role: StaffRole }) {
  return (
    <label className="flex items-center gap-2 text-meta text-ink-soft">
      <span className="shrink-0">{c.previewRole}</span>
      <select
        value={role}
        onChange={(e) => setPreviewRole(e.target.value as StaffRole)}
        className="h-11 min-w-0 flex-1 rounded-pill border border-line bg-surface px-3 text-meta text-ink md:h-9"
      >
        {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
    </label>
  );
}

function Crumb({ href, label, last }: { href?: string; label: string; last: boolean }) {
  return (
    <li className={clsx("flex items-center gap-1.5", last ? "min-w-0" : "hidden shrink-0 sm:flex")}>
      {/* below sm only the last crumb shows, so its chevron would lead nowhere */}
      <ChevronRight className={clsx("size-3.5 shrink-0", last && "max-sm:hidden")} aria-hidden />
      {last || !href ? <span aria-current={last ? "page" : undefined} className={clsx("truncate", last && "font-medium text-ink")}>{label}</span>
        : <Link href={href} className="hover:text-ink">{label}</Link>}
    </li>
  );
}
