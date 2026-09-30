import type { PaymentProvider } from "@/types/domain";

/** Checkout copy + config. Server stays authoritative on prices; these drive the display estimate. */
export const checkoutSteps = [
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
] as const;
export type CheckoutStepId = (typeof checkoutSteps)[number]["id"];

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;

/** Paise. Standard shipping is free at or above this subtotal. */
export const FREE_SHIPPING_THRESHOLD = 199900;
/** GST is included in listed prices; shown as an "includes" line. */
export const GST_RATE = 0.12;

export interface ShippingMethod {
  id: string; label: string; eta: string; cost: number; freeAboveThreshold: boolean;
}
export const shippingMethods: ShippingMethod[] = [
  { id: "standard", label: "Standard delivery", eta: "4–6 business days", cost: 9900, freeAboveThreshold: true },
  { id: "express", label: "Express delivery", eta: "1–2 business days (metros)", cost: 24900, freeAboveThreshold: false },
];

export interface PaymentMethod {
  id: string; provider: PaymentProvider; label: string; description: string;
  enabled: boolean; /** shown when disabled */ unavailableReason?: string;
  fee: number; badge?: string;
}
/** Admin toggles gateways in the DB; this is the const fallback. */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "razorpay", provider: "razorpay", label: "UPI, cards & netbanking",
    description: "Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard and 50+ banks via Razorpay.",
    enabled: true, fee: 0, badge: "Recommended",
  },
  {
    id: "payu", provider: "payu", label: "PayU",
    description: "Cards, wallets and EMI via PayU.",
    enabled: false, unavailableReason: "Temporarily unavailable — please choose another method.", fee: 0,
  },
  {
    id: "cod", provider: "cod", label: "Cash on delivery",
    description: "Pay in cash or UPI when your order arrives. Available on orders up to ₹10,000.",
    enabled: true, fee: 4900,
  },
];
export const COD_LIMIT = 1000000;

/** Demo coupons (server validates the real ones). */
export const coupons: Record<string, { label: string; percentOff: number }> = {
  WELCOME10: { label: "Welcome offer — 10% off", percentOff: 10 },
};
/** Demo bundle offer: 3 or more items → 15% off. */
export const bundleOffer = { minItems: 3, percentOff: 15, label: "Bundle offer: 3+ pieces, 15% off" };

export const FAILURE_STAGES = {
  bank_declined: "Your bank declined the payment.",
  user_cancelled: "The payment was cancelled before it completed.",
  otp_timeout: "The OTP wasn't entered in time.",
  insufficient_funds: "The account had insufficient funds.",
  gateway_error: "The payment gateway had a temporary problem.",
  network_error: "We lost connection while confirming the payment.",
} as const;
export type FailureStage = keyof typeof FAILURE_STAGES;

export const checkoutCopy = {
  secureBadge: "Secure checkout",
  loginPrompt: "Have an account?",
  loginCta: "Log in for faster checkout",
  estimateNote: "Final amount is confirmed by our server before payment.",
  emptyTitle: "Your bag is empty",
  emptyBody: "Add a few pieces before checking out.",
  placeOrder: "Place order",
  failureTitle: "Payment didn't go through",
  failureNoCharge: "Your bag is saved. If any amount was debited, it will be auto-refunded within 5–7 business days — retrying will not charge you twice.",
  retry: "Retry payment",
  otherMethod: "Choose another method",
  support: "Need help? Write to us with your order reference",
  successTitle: "Thank you — your order is placed",
  successNext: [
    { title: "Confirmation email", body: "We've sent your receipt and order details." },
    { title: "Track your order", body: "You'll get a tracking link by SMS and email once it ships." },
    { title: "Easy returns", body: "Return eligible pieces within 15 days of delivery." },
  ],
  guestPrompt: "Create an account to track orders and check out faster next time.",
};
