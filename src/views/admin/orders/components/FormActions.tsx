"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/** Explicit Save / Cancel bar for full-page edit forms (nothing saves until Save is pressed). */
export function FormActions({ saving, backHref, label = "Save", extra }: { saving: boolean; backHref: string; label?: string; extra?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-canvas px-1 py-3">
      <Button type="submit" loading={saving}>{label}</Button>
      <Link href={backHref} className="inline-flex h-11 items-center px-4 text-body underline">Cancel</Link>
      <span className="ml-auto">{extra}</span>
    </div>
  );
}
