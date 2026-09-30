/** Checkout microcopy not yet in src/data/copy.ts (ponytail: fold into checkoutCopy on its next edit). */
export const checkoutSteps3 = ["Contact", "Delivery", "Payment"] as const;

export const co = {
  title: "Checkout", progress: "Checkout progress", edit: "Edit", done: "(completed)",
  contact: { email: "Email", emailHint: "Your order confirmation goes here", phone: "Mobile number", phoneHint: "10 digits, for delivery updates", cta: "Continue to delivery" },
  delivery: {
    saved: "Saved addresses", useNew: "Use a new address", deliverHere: "Deliver to this address", cta: "Continue to payment",
    save: "Save this address to my account", methods: "Delivery speed", methodsLoading: "Finding delivery options",
    methodsEmpty: "Enter your address to see delivery options.", methodsFailed: "We couldn't load delivery options. Please try again.",
    days: (min: number, max: number) => (min === max ? `${min} ${min === 1 ? "day" : "days"}` : `${min}-${max} days`),
  },
  address: {
    name: "Full name", phone: "Mobile number", line1: "House no., building, street", line2: "Area, locality (optional)",
    landmark: "Landmark (optional)", pincode: "Pincode", pincodeHint: "We'll fill in your city and state",
    city: "City", state: "State", selectState: "Select state", makeDefault: "Make this my default address",
    checking: "Checking delivery...", eta: (d: string) => `Delivers in ${d}`, cod: "Cash on delivery available",
    noCod: "Prepaid only for this pincode", unserviceable: "We may not deliver to this pincode yet. Double-check it or contact us.",
  },
  payment: {
    legend: "Payment method", pay: (t: string) => `Pay ${t}`, placeCod: (t: string) => `Place order · ${t}`,
    fee: (f: string) => `+ ${f} cash handling fee`, unavailable: "Unavailable", above: (t: string) => `Not available above ${t}`,
    below: (t: string) => `Available from ${t}`, methods: { upi: "UPI", card: "Cards", netbanking: "Netbanking", wallet: "Wallets", emi: "EMI" } as Record<string, string>,
    opening: "Opening secure payment...", verifying: "Confirming your payment...", noGateway: "Online payment is not available right now.",
    refund: "We couldn't confirm this payment against your order. Any amount debited will be refunded; please contact support with your order number.",
  },
  trust: { secure: "256-bit encrypted checkout", razorpay: "Payments processed by Razorpay", returns: (d: number) => `Easy returns within ${d} days` },
  summary: { title: "Order summary", show: "View summary", items: (n: number) => `${n} ${n === 1 ? "item" : "items"}` },
  success: {
    overline: "Order confirmed", number: "Order number", emailed: (e: string) => `A confirmation is on its way to ${e}.`,
    pending: "We're confirming your payment. This usually takes under a minute; your order is safe.",
    eta: "Estimated delivery", track: "Track your order", viewOrder: "View order", createAccount: "Create account",
    shipTo: "Delivering to", paidWith: { razorpay: "Paid online", cod: "Cash on delivery", payu: "Paid online" } as Record<string, string>,
  },
  reference: "Order reference", loading: "Loading checkout",
} as const;
