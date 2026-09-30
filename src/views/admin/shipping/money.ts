/** Rupee input string <-> integer paise. */
export const paise = (rupees: string) => Math.round((Number(rupees) || 0) * 100);
export const rupees = (p: number) => String(p / 100);
