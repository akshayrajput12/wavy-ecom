"use client";

import { useSyncExternalStore } from "react";
import type { StaffRole } from "@/data/admin/types";
import { can, ROLE_LABELS, type Permission } from "@/views/admin/rbac";

/**
 * Current staff role for the UI. Demo = super_admin.
 * ponytail: dev-only role preview lives in localStorage; TODO(backend agent): read the role from the staff session.
 */
const KEY = "wavy.admin.previewRole";
const DEFAULT: StaffRole = "super_admin";
const listeners = new Set<() => void>();
const allowPreview = process.env.NODE_ENV !== "production";

function read(): StaffRole {
  if (!allowPreview) return DEFAULT;
  try {
    const v = localStorage.getItem(KEY);
    return v && v in ROLE_LABELS ? (v as StaffRole) : DEFAULT;
  } catch {
    return DEFAULT;
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
  const role = useSyncExternalStore(subscribe, read, () => DEFAULT);
  return { role, allowPreview };
}

export function useCan(p: Permission) {
  return can(useRole().role, p);
}
