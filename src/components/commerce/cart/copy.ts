/** Cart microcopy not in src/data/copy.ts (ponytail: fold into cartCopy when that file is next edited). */
export const cartExtraCopy = {
  removed: (name: string) => `Removed ${name}`,
  undo: "Undo",
  updating: "Updating prices",
  quoteFailed: "We couldn't refresh prices. Totals will be confirmed at checkout.",
  fixItems: "Update the highlighted items to check out.",
  freeUnlocked: "Free delivery unlocked",
  freeLeft: (amount: string) => `${amount} away from free delivery`,
  saved: (amount: string) => `You're saving ${amount}`,
  offerLabel: "Offer",
  couponInvalid: "That code can't be applied.",
} as const;
