import type { Address, Order, PaymentProvider, PaymentStatus, ReturnStatus } from "@/types/domain";
import type { FailureStage } from "./checkout";

// ponytail: local extensions of Order until types/domain.ts grows payment attempts + returns
export interface PaymentAttempt {
  id: string; provider: PaymentProvider; method: string; status: PaymentStatus;
  amount: number; at: string; failureStage?: FailureStage;
}
export type AccountOrder = Order & { paymentAttempts: PaymentAttempt[]; shippingMethod: string };
export interface ReturnRequest {
  ref: string; orderNumber: string; itemId: string; itemName: string;
  reason: string; status: ReturnStatus; createdAt: string;
}

const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/${id}?w=400&q=70`, alt });
const TEE = img("photo-1521572163474-6864f9cf17ab", "White heavyweight cotton tee");
const SNEAKER = img("photo-1542291026-7eec264c27ff", "Red low-top sneaker");
const JACKET = img("photo-1551028719-00167b16eac5", "Denim chore jacket");
const TROUSER = img("photo-1473966968600-fa801b869a1a", "Pleated beige trouser");
const KNIT = img("photo-1434389677669-e08b4cac3105", "Oatmeal knit sweater");

const home: Address = {
  id: "addr-1", name: "Aanya Mehta", phone: "9876543210", line1: "42, 100 Feet Road, Indiranagar",
  line2: "Flat 3B, Lakeview Residency", city: "Bengaluru", state: "Karnataka", postalCode: "560038",
  country: "IN", isDefault: true,
};
const work: Address = {
  id: "addr-2", name: "Aanya Mehta", phone: "9876543210", line1: "WeWork Galaxy, 43 Residency Road",
  city: "Bengaluru", state: "Karnataka", postalCode: "560025", country: "IN",
};

export const demoUser = {
  id: "user-demo", name: "Aanya Mehta", email: "aanya@example.com", phone: "9876543210",
  memberSince: "2025-11-02", addresses: [home, work],
};

const totals = (subtotal: number, discount = 0, shipping = 0) => {
  const total = subtotal - discount + shipping;
  return { subtotal, discount, shipping, tax: Math.round(total - total / 1.12), total };
};

export const orders: AccountOrder[] = [
  {
    id: "ord-1", number: "BB10458", status: "shipped", paymentStatus: "captured",
    email: demoUser.email, phone: demoUser.phone, shippingAddress: home, placedAt: "2026-09-22T10:14:00+05:30",
    items: [
      { id: "oi-11", productId: "p-jacket", variantId: "v-jacket-m", name: "Raw Chore Jacket", image: JACKET, color: "Indigo", size: "M", unitPrice: 489900, quantity: 1 },
      { id: "oi-12", productId: "p-tee", variantId: "v-tee-m", name: "Heavyweight Tee", image: TEE, color: "Chalk", size: "M", unitPrice: 129900, quantity: 2 },
    ],
    totals: totals(749700),
    trackingToken: "trk_7Hq2mZp4", shippingMethod: "Standard delivery",
    paymentAttempts: [{ id: "pa-11", provider: "razorpay", method: "UPI", status: "captured", amount: 749700, at: "2026-09-22T10:15:00+05:30" }],
    shipment: {
      carrier: "Delhivery", awb: "1490 2273 8841", status: "in_transit", eta: "2026-09-27",
      events: [
        { at: "2026-09-22T10:15:00+05:30", status: "created", location: "Bengaluru", note: "Order confirmed and packed" },
        { at: "2026-09-23T18:40:00+05:30", status: "picked_up", location: "Mumbai warehouse", note: "Picked up by courier" },
        { at: "2026-09-24T22:05:00+05:30", status: "in_transit", location: "Pune hub", note: "In transit to destination city" },
      ],
    },
  },
  {
    id: "ord-2", number: "BB10463", status: "pending_payment", paymentStatus: "failed",
    email: demoUser.email, phone: demoUser.phone, shippingAddress: work, placedAt: "2026-09-24T21:02:00+05:30",
    items: [
      { id: "oi-21", productId: "p-sneaker", variantId: "v-sneaker-9", name: "V01 Low Sneaker", image: SNEAKER, color: "Signal Red", size: "UK 9", unitPrice: 569900, quantity: 1 },
    ],
    totals: totals(569900),
    trackingToken: "trk_Rw9xLc3e", shippingMethod: "Express delivery",
    paymentAttempts: [
      { id: "pa-21", provider: "razorpay", method: "Card •••• 4417", status: "failed", amount: 569900, at: "2026-09-24T21:03:00+05:30", failureStage: "bank_declined" },
      { id: "pa-22", provider: "razorpay", method: "UPI", status: "failed", amount: 569900, at: "2026-09-24T21:06:00+05:30", failureStage: "user_cancelled" },
    ],
  },
  {
    id: "ord-3", number: "BB10421", status: "delivered", paymentStatus: "captured",
    email: demoUser.email, phone: demoUser.phone, shippingAddress: home, placedAt: "2026-09-08T12:30:00+05:30",
    items: [
      { id: "oi-31", productId: "p-trouser", variantId: "v-trouser-32", name: "Pleated Trouser", image: TROUSER, color: "Clay", size: "32", unitPrice: 349900, quantity: 1 },
      { id: "oi-32", productId: "p-knit", variantId: "v-knit-m", name: "Oatmeal Knit", image: KNIT, color: "Oatmeal", size: "M", unitPrice: 299900, quantity: 1 },
      { id: "oi-33", productId: "p-tee", variantId: "v-tee-l", name: "Heavyweight Tee", image: TEE, color: "Black", size: "L", unitPrice: 129900, quantity: 1 },
    ],
    totals: totals(779700, 116955),
    trackingToken: "trk_A1b2C3d4", shippingMethod: "Standard delivery",
    paymentAttempts: [{ id: "pa-31", provider: "razorpay", method: "Card •••• 1290", status: "captured", amount: 662745, at: "2026-09-08T12:31:00+05:30" }],
    shipment: {
      carrier: "Blue Dart", awb: "7750 1182 3309", status: "delivered", eta: "2026-09-12",
      events: [
        { at: "2026-09-08T12:31:00+05:30", status: "created", location: "Bengaluru", note: "Order confirmed" },
        { at: "2026-09-09T16:10:00+05:30", status: "picked_up", location: "Mumbai warehouse", note: "Picked up by courier" },
        { at: "2026-09-10T23:45:00+05:30", status: "in_transit", location: "Hyderabad hub", note: "In transit" },
        { at: "2026-09-12T08:20:00+05:30", status: "out_for_delivery", location: "Indiranagar, Bengaluru", note: "Out for delivery" },
        { at: "2026-09-12T13:05:00+05:30", status: "delivered", location: "Indiranagar, Bengaluru", note: "Delivered — received by Aanya" },
      ],
    },
  },
  {
    id: "ord-4", number: "BB10387", status: "return_requested", paymentStatus: "captured",
    email: demoUser.email, phone: demoUser.phone, shippingAddress: home, placedAt: "2026-08-30T09:12:00+05:30",
    items: [
      { id: "oi-41", productId: "p-sneaker", variantId: "v-sneaker-8", name: "V01 Low Sneaker", image: SNEAKER, color: "Signal Red", size: "UK 8", unitPrice: 569900, quantity: 1 },
    ],
    totals: totals(569900),
    trackingToken: "trk_Pq8sT0uv", shippingMethod: "Standard delivery",
    paymentAttempts: [{ id: "pa-41", provider: "cod", method: "Cash on delivery", status: "captured", amount: 569900, at: "2026-09-04T15:00:00+05:30" }],
    shipment: {
      carrier: "Delhivery", awb: "1490 2201 5567", status: "delivered", eta: "2026-09-04",
      events: [
        { at: "2026-08-30T09:13:00+05:30", status: "created", location: "Bengaluru" },
        { at: "2026-08-31T14:00:00+05:30", status: "picked_up", location: "Mumbai warehouse" },
        { at: "2026-09-02T20:30:00+05:30", status: "in_transit", location: "Pune hub" },
        { at: "2026-09-04T14:40:00+05:30", status: "delivered", location: "Indiranagar, Bengaluru" },
      ],
    },
  },
  {
    id: "ord-5", number: "BB10312", status: "delivered", paymentStatus: "captured",
    email: demoUser.email, phone: demoUser.phone, shippingAddress: home, placedAt: "2026-07-14T19:40:00+05:30",
    items: [
      { id: "oi-51", productId: "p-tee", variantId: "v-tee-m", name: "Heavyweight Tee", image: TEE, color: "Chalk", size: "M", unitPrice: 129900, quantity: 1 },
    ],
    totals: totals(129900, 0, 9900),
    trackingToken: "trk_Zz5yX6wv", shippingMethod: "Standard delivery",
    paymentAttempts: [{ id: "pa-51", provider: "razorpay", method: "UPI", status: "captured", amount: 139800, at: "2026-07-14T19:41:00+05:30" }],
    shipment: {
      carrier: "Blue Dart", awb: "7750 0918 2214", status: "delivered", eta: "2026-07-19",
      events: [
        { at: "2026-07-14T19:41:00+05:30", status: "created", location: "Bengaluru" },
        { at: "2026-07-19T12:10:00+05:30", status: "delivered", location: "Indiranagar, Bengaluru" },
      ],
    },
  },
];

export const returns: ReturnRequest[] = [
  { ref: "RT-3871", orderNumber: "BB10387", itemId: "oi-41", itemName: "V01 Low Sneaker · UK 8", reason: "Size too small", status: "pickup_scheduled", createdAt: "2026-09-10T11:00:00+05:30" },
];
