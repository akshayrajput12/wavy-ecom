/** Pure Combobox logic: filtering, exact match, active-option movement. */

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Prefix matches first, then word-start matches, then anywhere; case and accent insensitive; order kept within a group. */
export function filterOptions(options: readonly string[], query: string, limit = 60): string[] {
  const q = fold(query);
  if (!q) return options.slice(0, limit);
  const starts: string[] = [], words: string[] = [], inside: string[] = [];
  for (const o of options) {
    const f = fold(o);
    if (f.startsWith(q)) starts.push(o);
    else if (f.includes(` ${q}`)) words.push(o);
    else if (f.includes(q)) inside.push(o);
  }
  return [...starts, ...words, ...inside].slice(0, limit);
}

/** The option that equals `text` ignoring case/accents/spacing (for typed or browser-autofilled values). */
export const exactOption = (options: readonly string[], text: string) => {
  const t = fold(text);
  return t ? options.find((o) => fold(o) === t) : undefined;
};

/** Next active index for a navigation key; wraps on arrows. -1 = none. */
export function moveActive(key: string, current: number, count: number): number {
  if (count === 0) return -1;
  switch (key) {
    case "ArrowDown": return current < 0 || current >= count - 1 ? 0 : current + 1;
    case "ArrowUp": return current <= 0 ? count - 1 : current - 1;
    case "Home": return 0;
    case "End": return count - 1;
    default: return current;
  }
}
