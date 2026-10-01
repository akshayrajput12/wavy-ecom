import type { Faq } from "@/types/domain";

/** Shared by the server FAQ intro and the client list (kept out of the "use client" module). */
export const groupsOf = (faqs: Faq[]) => [...faqs.reduce((m, f) => m.set(f.category, [...(m.get(f.category) ?? []), f]), new Map<string, Faq[]>())];
export const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
