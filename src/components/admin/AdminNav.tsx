"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, type FocusEvent, type MouseEvent } from "react";
import { adminCopy } from "@/data/copy";
import type { StaffRole } from "@/types/admin";
import { ADMIN_NAV, can } from "@/views/admin/rbac";
import { usePersisted } from "./usePersisted";

type Tip = { label: string; top: number; left: number };

/**
 * Role-filtered admin nav, grouped. Groups collapse (persisted). With `rail`, items are icon-only and
 * the label shows as a tooltip on hover/focus; the tooltip is `fixed` so the scrolling nav can't clip it.
 */
export function AdminNav({ role, currentHref, rail = false, onNavigate, className }: {
  role: StaffRole; currentHref?: string; rail?: boolean; onNavigate?: () => void; className?: string;
}) {
  const [closedRaw, setClosed] = usePersisted("wavy.admin.closedGroups");
  const closed = closedRaw ? closedRaw.split("|") : [];
  const [tip, setTip] = useState<Tip | null>(null);

  const toggleGroup = (label: string) =>
    setClosed((closed.includes(label) ? closed.filter((l) => l !== label) : [...closed, label]).join("|"));
  const showTip = (label: string) => (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    if (!rail) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 8 });
  };
  const hideTip = () => setTip(null);

  return (
    <nav aria-label={adminCopy.navLabel} className={className} onScroll={hideTip}>
      {ADMIN_NAV.map((group, gi) => {
        const items = group.items.filter((i) => can(role, i.permission));
        if (!items.length) return null;
        const listId = `admin-nav-group-${gi}`;
        const open = rail || !closed.includes(group.label);
        const hasActive = items.some((i) => i.href === currentHref);
        return (
          <div key={group.label} className="group mt-3 first:mt-0">
            {rail ? (
              <hr className="mx-3 mb-3 border-line group-first:hidden" aria-hidden />
            ) : (
              <button
                type="button" aria-expanded={open} aria-controls={listId} onClick={() => toggleGroup(group.label)}
                className="flex min-h-11 w-full items-center gap-2 rounded-pill px-3 text-left text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <span className="t-overline min-w-0 flex-1 truncate">{group.label}</span>
                {!open && hasActive && <span className="size-2 shrink-0 rounded-full bg-ink" aria-hidden />}
                <ChevronDown className={clsx("size-4 shrink-0 transition-transform", !open && "-rotate-90")} aria-hidden />
              </button>
            )}
            <ul id={listId} hidden={!open} className="flex flex-col gap-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = currentHref === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={showTip(label)} onMouseLeave={hideTip} onFocus={showTip(label)} onBlur={hideTip}
                      onKeyDown={(e) => e.key === "Escape" && hideTip()}
                      className={clsx(
                        "flex min-h-11 items-center gap-3 rounded-pill text-body transition-colors",
                        rail ? "mx-auto w-11 justify-center" : "px-3",
                        active ? "bg-ink font-medium text-on-dark shadow-sm" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className={rail ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {rail && tip && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-sm bg-ink px-2.5 py-1 text-meta whitespace-nowrap text-on-dark shadow-md"
          style={{ top: tip.top, left: tip.left }}
        >{tip.label}</span>
      )}
    </nav>
  );
}
