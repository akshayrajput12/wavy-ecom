"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CouponField({ value, valid, onApply }: { value?: string; valid: boolean; onApply: (code?: string) => void }) {
  const [code, setCode] = useState(value ?? "");
  const invalid = !!value && !valid;
  return (
    <div className="mt-4 grid gap-1.5">
      <label htmlFor="coupon" className="text-meta font-medium">Coupon code</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
          aria-invalid={invalid} aria-describedby="coupon-msg" placeholder="e.g. WELCOME10"
          className="h-11 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-body uppercase focus:border-ink focus:outline-none" />
        {value && valid ? (
          <Button variant="ghost" onClick={() => { setCode(""); onApply(undefined); }}>Remove</Button>
        ) : (
          <Button variant="secondary" disabled={!code.trim()} onClick={() => onApply(code.trim())}>Apply</Button>
        )}
      </div>
      <p id="coupon-msg" role="status" className={`text-meta ${invalid ? "text-danger" : "text-success"}`}>
        {invalid ? "⚠ This code isn't valid for your bag." : value && valid ? `✓ ${value} applied` : ""}
      </p>
    </div>
  );
}
