import type { OrderStatus, PaymentStatus } from "@/types/domain";
import type { AdminOrder, Customer, PaymentAttempt } from "./types";

const addr = (name: string, city: string, state: string, postalCode: string) => ({
  name, phone: "+91 98XXXXXX21", line1: "14, 2nd Cross, Main Road", city, state, postalCode, country: "IN",
});

type Seed = [num: string, cust: string, name: string, city: string, state: string, pin: string, status: OrderStatus, pay: PaymentStatus, placed: string, qty: number, unit: number, product: string, attempts: PaymentAttempt[]];

const ok = (id: string, at: string, amount: number, method = "UPI"): PaymentAttempt => ({
  id, at, provider: "razorpay", method, amount, status: "captured", stage: "none", reference: `pay_${id}`,
});
const fail = (id: string, at: string, amount: number, stage: PaymentAttempt["stage"], message: string, method = "Card"): PaymentAttempt => ({
  id, at, provider: "razorpay", method, amount, status: "failed", stage, message,
});

const seeds: Seed[] = [
  ["BB-10421", "c-aarav", "Aarav Mehta", "Bengaluru", "Karnataka", "560038", "paid", "captured", "2026-09-25T08:12:00+05:30", 1, 699900, "Studio Runner 01",
    [fail("a1", "2026-09-25T08:09:00+05:30", 699900, "bank_decline", "Issuer declined: insufficient funds"), ok("a2", "2026-09-25T08:11:40+05:30", 699900)]],
  ["BB-10420", "c-isha", "Isha Kapoor", "New Delhi", "Delhi", "110057", "processing", "captured", "2026-09-25T07:40:00+05:30", 3, 99900, "Core Heavyweight Tee",
    [ok("b1", "2026-09-25T07:39:30+05:30", 299700)]],
  ["BB-10419", "c-rohan", "Rohan Iyer", "Mumbai", "Maharashtra", "400050", "pending_payment", "failed", "2026-09-25T06:55:00+05:30", 1, 349900, "Daybreak Hoodie",
    [fail("c1", "2026-09-25T06:55:10+05:30", 349900, "customer_auth", "OTP not completed", "Card"), fail("c2", "2026-09-25T06:58:02+05:30", 349900, "timeout", "UPI collect request expired", "UPI"), fail("c3", "2026-09-25T07:01:44+05:30", 349900, "verification", "Signature mismatch on callback", "UPI")]],
  ["BB-10418", "c-meera", "Meera Nair", "Kochi", "Kerala", "682016", "packed", "captured", "2026-09-24T19:20:00+05:30", 1, 279900, "Modular Cargo Pant",
    [ok("d1", "2026-09-24T19:19:00+05:30", 279900, "Netbanking")]],
  ["BB-10417", "c-aarav", "Aarav Mehta", "Bengaluru", "Karnataka", "560038", "shipped", "captured", "2026-09-23T14:02:00+05:30", 1, 549900, "Court Low",
    [ok("e1", "2026-09-23T14:01:00+05:30", 549900)]],
  ["BB-10416", "c-kabir", "Kabir Singh", "Pune", "Maharashtra", "411001", "delivered", "captured", "2026-09-21T11:45:00+05:30", 2, 129900, "Core Heavyweight Tee",
    [ok("f1", "2026-09-21T11:44:00+05:30", 259800, "Card")]],
  ["BB-10415", "c-sara", "Sara Khan", "Hyderabad", "Telangana", "500034", "return_requested", "captured", "2026-09-18T16:30:00+05:30", 1, 219900, "Boxy Linen Shirt",
    [ok("g1", "2026-09-18T16:29:00+05:30", 219900)]],
  ["BB-10414", "c-isha", "Isha Kapoor", "New Delhi", "Delhi", "110057", "refunded", "refunded", "2026-09-15T10:10:00+05:30", 1, 699900, "Studio Runner 01",
    [ok("h1", "2026-09-15T10:09:00+05:30", 699900, "Card")]],
  ["BB-10413", "c-dev", "Dev Patel", "Ahmedabad", "Gujarat", "380015", "cancelled", "failed", "2026-09-14T21:05:00+05:30", 1, 149900, "Track Short",
    [fail("i1", "2026-09-14T21:05:20+05:30", 149900, "gateway_init", "Order creation failed at gateway (5xx)", "UPI")]],
];

export const adminOrders: AdminOrder[] = seeds.map(([number, customerId, customerName, city, state, pin, status, paymentStatus, placedAt, qty, unit, product, paymentAttempts], i) => {
  const subtotal = qty * unit;
  const shipping = subtotal >= 149900 ? 0 : 9900;
  const shipped = ["shipped", "delivered", "return_requested", "refunded"].includes(status);
  return {
    id: `o-${number}`, number, status, paymentStatus, customerId, customerName,
    email: `${customerId.slice(2)}@example.in`, phone: "+91 98XXXXXX21",
    shippingAddress: addr(customerName, city, state, pin),
    items: [{ id: `oi-${i}`, productId: "p", variantId: "v", name: product, image: { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=70", alt: product }, color: "Bone", size: "M", unitPrice: unit, quantity: qty }],
    totals: { subtotal, discount: 0, shipping, tax: Math.round(subtotal - subtotal / 1.12), total: subtotal + shipping },
    placedAt, paymentAttempts,
    shipment: shipped ? { carrier: "Shiprocket · Delhivery", awb: `DLV${4400120 + i}`, status: status === "shipped" ? "in_transit" : "delivered", events: [
      { at: placedAt, status: "created", location: "Mumbai FC" },
      { at: placedAt, status: "picked_up", location: "Mumbai FC" },
    ] } : undefined,
    notes: i === 0 ? [{ id: "n1", at: placedAt, author: "Priya (Support)", body: "Customer asked for gift wrap — added." }] : [],
    timeline: [
      { at: placedAt, label: "Order placed", actor: "Customer" },
      ...(paymentStatus === "captured" || paymentStatus === "refunded" ? [{ at: placedAt, label: "Payment captured", actor: "Razorpay webhook" }] : []),
      ...(shipped ? [{ at: placedAt, label: "Shipment created", actor: "Rahul (Ops)" }] : []),
    ],
  };
});

export const adminCustomers: Customer[] = [
  { id: "c-aarav", name: "Aarav Mehta", email: "aarav@example.in", phone: "+91 98XXXXXX11", city: "Bengaluru", joinedAt: "2025-11-02", orders: 6, lifetimeValue: 2849400, lastOrderAt: "2026-09-25", tags: ["VIP", "Sneakers"],
    journey: [
      { at: "2026-09-25T08:02:00+05:30", type: "page_view", label: "/products/studio-runner-01" },
      { at: "2026-09-25T08:04:00+05:30", type: "tryon", label: "Try-on generated · Studio Runner 01" },
      { at: "2026-09-25T08:06:00+05:30", type: "add_to_cart", label: "Studio Runner 01 · UK9" },
      { at: "2026-09-25T08:08:00+05:30", type: "checkout", label: "Checkout started" },
      { at: "2026-09-25T08:09:00+05:30", type: "payment", label: "Card declined (bank)" },
      { at: "2026-09-25T08:11:40+05:30", type: "payment", label: "UPI captured" },
    ],
    tickets: [{ id: "T-882", subject: "Exchange size for Court Low", status: "resolved", at: "2026-09-24" }] },
  { id: "c-isha", name: "Isha Kapoor", email: "isha@example.in", phone: "+91 98XXXXXX12", city: "New Delhi", joinedAt: "2026-01-18", orders: 4, lifetimeValue: 1459300, lastOrderAt: "2026-09-25", tags: ["Repeat"],
    journey: [{ at: "2026-09-25T07:30:00+05:30", type: "search", label: "Searched “heavyweight tee”" }, { at: "2026-09-25T07:36:00+05:30", type: "add_to_cart", label: "Any 3 for ₹999 bundle" }],
    tickets: [{ id: "T-870", subject: "Refund status for BB-10414", status: "pending", at: "2026-09-20" }] },
  { id: "c-rohan", name: "Rohan Iyer", email: "rohan@example.in", phone: "+91 98XXXXXX13", city: "Mumbai", joinedAt: "2026-09-25", orders: 0, lifetimeValue: 0, tags: ["At risk"],
    journey: [{ at: "2026-09-25T06:50:00+05:30", type: "page_view", label: "/collections/hoodies" }, { at: "2026-09-25T06:55:10+05:30", type: "payment", label: "3 failed payment attempts" }],
    tickets: [] },
  { id: "c-meera", name: "Meera Nair", email: "meera@example.in", phone: "+91 98XXXXXX14", city: "Kochi", joinedAt: "2026-04-09", orders: 2, lifetimeValue: 429800, lastOrderAt: "2026-09-24", tags: [], journey: [], tickets: [] },
  { id: "c-kabir", name: "Kabir Singh", email: "kabir@example.in", phone: "+91 98XXXXXX15", city: "Pune", joinedAt: "2025-08-30", orders: 9, lifetimeValue: 3120500, lastOrderAt: "2026-09-21", tags: ["VIP"], journey: [], tickets: [] },
  { id: "c-sara", name: "Sara Khan", email: "sara@example.in", phone: "+91 98XXXXXX16", city: "Hyderabad", joinedAt: "2026-06-12", orders: 1, lifetimeValue: 219900, lastOrderAt: "2026-09-18", tags: ["Return open"], journey: [], tickets: [{ id: "T-879", subject: "Linen shirt shrank after wash", status: "open", at: "2026-09-22" }] },
  { id: "c-dev", name: "Dev Patel", email: "dev@example.in", phone: "+91 98XXXXXX17", city: "Ahmedabad", joinedAt: "2026-09-14", orders: 0, lifetimeValue: 0, tags: [], journey: [], tickets: [] },
];
