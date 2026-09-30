"use client";

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { StaffRole } from "@/types/admin";
import { can, ROLE_LABELS, type Permission } from "@/views/admin/rbac";

/**
 * Current staff role for the UI: the real session role (provided by AdminShell), with a dev-only preview override.
 * The server re-checks every action; this is cosmetic.
 */
const KEY = "wavy.admin.previewRole";
const DEFAULT: StaffRole = "super_admin";
const listeners = new Set<() => void>();
const allowPreview = process.env.NODE_ENV !== "production";
const SessionRole = createContext<StaffRole>(DEFAULT);

export function RoleProvider({ role, children }: { role: StaffRole; children: ReactNode }) {
  return createElement(SessionRole.Provider, { value: role }, children);
}

function read(): StaffRole | null {
  if (!allowPreview) return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && v in ROLE_LABELS ? (v as StaffRole) : null;
  } catch {
    return null;
  }
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}

export function setPreviewRole(role: StaffRole) {
  try { localStorage.setItem(KEY, role); } catch { /* private mode: preview just won't persist */ }
  listeners.forEach((l) => l());
}

export function useRole() {
  const session = useContext(SessionRole);
  const preview = useSyncExternalStore(subscribe, read, () => null);
  return { role: preview ?? session, allowPreview };
}

export function useCan(p: Permission) {
  return can(useRole().role, p);
}
