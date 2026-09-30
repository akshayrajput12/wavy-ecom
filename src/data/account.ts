/** Account, auth and returns copy + config. */
export const accountNav = [
  { href: "/account", label: "Account" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/returns", label: "Returns" },
] as const;

export const RETURN_WINDOW_DAYS = 15;
export const returnReasons = [
  "Size too small", "Size too large", "Not as pictured", "Damaged or defective",
  "Received wrong item", "Changed my mind",
] as const;
export const evidenceRules = { maxFiles: 3, maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] };

export const authCopy = {
  login: { title: "Welcome back", body: "Log in to track orders, manage returns and check out faster." },
  signup: { title: "Create your account", body: "Save addresses, track every order and get early access to drops." },
  forgot: { title: "Reset your password", body: "Enter your email and we'll send a secure reset link.", sent: "If an account exists for that email, a reset link is on its way." },
  terms: "I agree to the Terms of Service and Privacy Policy.",
  notConfigured: "Accounts aren't available in this demo yet — you can still check out as a guest.",
};

export const accountCopy = {
  returnsEmpty: "No return requests yet.",
  ordersEmpty: "You haven't placed any orders yet.",
  returnNotEligible: "This order has no items eligible for return. Returns are accepted within 15 days of delivery.",
  returnSuccessSteps: [
    "We've received your request and emailed a confirmation.",
    "Our team reviews it within 24 hours.",
    "Once approved, a courier picks up the item from your address.",
    "Refund is issued to your original payment method within 5–7 days of pickup.",
  ],
  trackingHelp: "Questions about your delivery? Write to us and quote your order number.",
};
