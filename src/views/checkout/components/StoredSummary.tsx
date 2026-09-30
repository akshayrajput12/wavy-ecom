"use client";

import { useSyncExternalStore } from "react";
import type { CartLine } from "@/types/domain";
import { OrderSummary, type SummaryTotals } from "./OrderSummary";

export const LAST_ORDER_KEY = "wavy:lastOrder"; // written by CheckoutView
type Snapshot = { number: string; lines: CartLine[]; totals: SummaryTotals };

const read = () => {
  try { return sessionStorage.getItem(LAST_ORDER_KEY); } catch { return null; }
};

/** Summary for orders the repo can't see yet (demo/mock orders): read the checkout snapshot. */
export function StoredSummary({ number }: { number: string }) {
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  let snap: Snapshot | null = null;
  try { snap = raw ? (JSON.parse(raw) as Snapshot) : null; } catch { /* corrupt snapshot: show nothing */ }
  return snap?.number === number ? <OrderSummary lines={snap.lines} totals={snap.totals} /> : null;
}
