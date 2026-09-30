export type FitPreference = "slim" | "regular" | "relaxed";
/** Upper body measurement (cm) each size is cut for. Ordered smallest → largest. */
export interface SizeRow { size: string; chest: number; waist: number }
export interface SizeInput { heightCm: number; chestCm: number; waistCm: number; fit: FitPreference }
export interface SizeResult { size: string; reasons: string[] }

const inRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;

/** Index of the first size whose measurement covers `value` (largest size if none). */
const fitIndex = (chart: SizeRow[], key: "chest" | "waist", value: number) => {
  const i = chart.findIndex((r) => value <= r[key]);
  return i === -1 ? chart.length - 1 : i;
};

/**
 * Pure size recommendation.
 * 1. The larger of chest/waist fits drives the base size (never too tight anywhere).
 * 2. Preference: "relaxed" goes one up; "slim" goes one down only if you're within 2 cm of the smaller size.
 * 3. Tall shoppers (≥185 cm) go one up for length unless they asked for slim.
 * 4. The garment's own fit note ("size down" / "size up") nudges one step.
 * Returns null when inputs are outside plausible human ranges.
 */
export function recommendSize(input: SizeInput, chart: SizeRow[], productFit = ""): SizeResult | null {
  const { heightCm, chestCm, waistCm, fit } = input;
  if (!chart.length || !inRange(heightCm, 130, 220) || !inRange(chestCm, 60, 160) || !inRange(waistCm, 50, 150)) return null;

  const chestIdx = fitIndex(chart, "chest", chestCm);
  const waistIdx = fitIndex(chart, "waist", waistCm);
  let idx = Math.max(chestIdx, waistIdx);
  const reasons = [
    `Your chest (${chestCm} cm) fits ${chart[chestIdx].size} and your waist (${waistCm} cm) fits ${chart[waistIdx].size}${chestIdx === waistIdx ? "" : ` — we go with the larger so nothing pulls`}.`,
  ];

  if (fit === "relaxed") {
    idx += 1;
    reasons.push("You prefer a roomier fit, so we went one size up.");
  } else if (fit === "slim" && idx > 0) {
    const smaller = chart[idx - 1];
    if (chestCm <= smaller.chest + 2 && waistCm <= smaller.waist + 2) {
      idx -= 1;
      reasons.push(`You're within 2 cm of ${smaller.size} and prefer a closer fit, so we went one size down.`);
    }
  }

  if (heightCm >= 185 && fit !== "slim") {
    idx += 1;
    reasons.push(`At ${heightCm} cm, one size up gives you enough length in the body and sleeves.`);
  }

  const note = productFit.toLowerCase();
  if (note.includes("size down") && fit !== "relaxed") {
    idx -= 1;
    reasons.push("This piece is cut generously — the designers recommend sizing down.");
  } else if (note.includes("size up")) {
    idx += 1;
    reasons.push("This piece runs small — we've sized up.");
  }

  const clamped = Math.min(Math.max(idx, 0), chart.length - 1);
  if (clamped !== idx) reasons.push(`${chart[clamped].size} is the closest size we make.`);
  return { size: chart[clamped].size, reasons };
}
