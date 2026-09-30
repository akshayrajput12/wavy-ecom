/** GST preview (paise). Display only — the server pricing service is authoritative. */
export function gstBreakdown(pricePaise: number, ratePercent: number, inclusive: boolean) {
  const base = inclusive ? Math.round(pricePaise / (1 + ratePercent / 100)) : pricePaise;
  const tax = inclusive ? pricePaise - base : Math.round((pricePaise * ratePercent) / 100);
  const half = Math.floor(tax / 2);
  return { base, tax, total: base + tax, cgst: half, sgst: tax - half };
}
