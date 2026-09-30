"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Inline two-step action: first click asks, second click runs it. */
export function ConfirmDelete({ label = "Delete", prompt = "Delete permanently?", yes = "Yes, delete", onConfirm, busy }: {
  label?: string; prompt?: string; yes?: string; onConfirm: () => void; busy?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button type="button" variant="secondary" size="sm" className="border-danger text-danger hover:bg-danger" onClick={() => setAsking(true)}>{label}</Button>;
  return (
    <span role="group" aria-label="Confirm" className="inline-flex flex-wrap items-center gap-2">
      <span className="text-meta font-medium text-danger">{prompt}</span>
      <Button type="button" size="sm" loading={busy} className="bg-danger hover:bg-danger" onClick={onConfirm}>{yes}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(false)}>Keep</Button>
    </span>
  );
}
