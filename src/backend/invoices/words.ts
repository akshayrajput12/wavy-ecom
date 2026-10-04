/** Amount in words, Indian numbering (thousand, lakh, crore). Pure. */
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
  "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const belowHundred = (n: number) => (n < 20 ? ONES[n] : [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join("-"));
const belowThousand = (n: number) =>
  [n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred` : "", belowHundred(n % 100)].filter(Boolean).join(" ");

/** Whole number in words: 1,23,45,678 -> "One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight". */
export function numberInWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7), lakh = Math.floor((n % 1e7) / 1e5), thousand = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  return [
    crore ? `${numberInWords(crore)} Crore` : "", // above 99 crore the crore count recurses ("One Hundred Crore")
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    belowThousand(rest),
  ].filter(Boolean).join(" ");
}

/** Paise -> "Indian Rupees One Thousand Two Hundred and Fifty Paise Only". */
export function amountInWords(paise: number): string {
  const p = Math.round(Math.abs(paise));
  const rupees = Math.floor(p / 100), rem = p % 100;
  const r = `Indian Rupees ${numberInWords(rupees)}`;
  return `${rem ? `${r} and ${belowHundred(rem)} Paise` : r} Only`;
}
