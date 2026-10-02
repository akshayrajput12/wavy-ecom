"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Check } from "lucide-react";
import { Fragment } from "react";
import type { AddressFields } from "@/backend/geo/normalise";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { addressCopy } from "@/data/copy";

const m = addressCopy.map;
export type Resolved = { loading: boolean; fields: AddressFields | null };

const list: Variants = { show: { transition: { staggerChildren: 0.05 } } };
const row: Variants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } } };

/** The reverse-geocoded address under the pin, animating in row by row, with the action that fills the form. */
export function AddressCard({ addr, onUse }: { addr: Resolved | null; onUse: (f: AddressFields) => void }) {
  const f = addr?.fields;
  const all: [string, string | undefined][] = f ? [
    [m.fields.line, [f.line1, f.landmark].filter(Boolean).join(", ")], [m.fields.locality, f.line2],
    [m.fields.city, f.city], [m.fields.state, f.state], [m.fields.pin, f.postalCode],
  ] : [];
  const rows = all.filter((r): r is [string, string] => !!r[1]);
  const key = addr?.loading ? "loading" : rows.map((r) => r[1]).join("|") || "none";

  return (
    <div aria-live="polite" aria-busy={addr?.loading}>
      <AnimatePresence mode="wait" initial={false}>
        {addr && (
          <motion.div key={key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }} className="grid gap-3 rounded-lg border border-line bg-canvas p-4">
            {addr.loading ? (
              <>
                <p className="text-meta text-ink-soft">{m.finding}</p>
                <div className="grid gap-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/5" /></div>
              </>
            ) : rows.length ? (
              <>
                <p className="t-overline text-ink-soft">{m.pinnedAt}</p>
                <motion.dl variants={list} initial="hidden" animate="show" className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-body">
                  {rows.map(([label, value]) => (
                    <Fragment key={label}>
                      <motion.dt variants={row} className="text-meta leading-6 text-ink-soft">{label}</motion.dt>
                      <motion.dd variants={row} className="text-ink">{value}</motion.dd>
                    </Fragment>
                  ))}
                </motion.dl>
                <Button type="button" className="max-sm:w-full sm:justify-self-start" onClick={() => f && onUse(f)}>
                  <Check className="size-4" aria-hidden /> {m.use}
                </Button>
              </>
            ) : (
              <p className="text-meta text-ink-soft">{m.noAddress}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
