import type { Review } from "@/types/domain";
import type { AdminBlogPost, AdminTestimonial, Campaign, Coupon, Offer } from "./types";

export const adminCoupons: Coupon[] = [
  { id: "cp1", code: "WELCOME10", type: "percent", value: 10, minOrder: 99900, usage: 412, usageLimit: 2000, startsAt: "2026-01-01", endsAt: "2026-12-31", status: "active", restriction: "First order only" },
  { id: "cp2", code: "FLAT500", type: "flat", value: 50000, minOrder: 399900, usage: 138, usageLimit: 500, startsAt: "2026-09-01", endsAt: "2026-09-30", status: "active", restriction: "Sneakers only" },
  { id: "cp3", code: "SHIPFREE", type: "free_shipping", value: 0, minOrder: 0, usage: 91, startsAt: "2026-08-15", endsAt: "2026-10-15", status: "paused", restriction: "App users" },
  { id: "cp4", code: "MONSOON15", type: "percent", value: 15, minOrder: 199900, usage: 780, usageLimit: 800, startsAt: "2026-06-15", endsAt: "2026-08-31", status: "expired", restriction: "Monsoon Edit collection" },
  { id: "cp5", code: "DIWALI20", type: "percent", value: 20, minOrder: 249900, usage: 0, usageLimit: 3000, startsAt: "2026-10-20", endsAt: "2026-11-05", status: "draft", restriction: "Sitewide, excl. sale" },
];

export const adminOffers: Offer[] = [
  { id: "of1", kind: "bundle", name: "Any 3 for ₹999", status: "active", quantity: 3, collectionId: "col-essentials", price: 99900 },
  { id: "of2", kind: "bogo", name: "Buy 1 Get 1 — Tees", status: "paused", buy: 1, get: 1, collectionId: "col-new" },
  { id: "of3", kind: "tiered", name: "Spend more, save more", status: "draft", tiers: [{ minSubtotal: 299900, percentOff: 5 }, { minSubtotal: 499900, percentOff: 10 }, { minSubtotal: 799900, percentOff: 15 }] },
];

export const adminCampaigns: Campaign[] = [
  { id: "cm1", name: "Studio Runner 01 restock", channel: "email", status: "completed", audience: "Waitlist · 4,210", sent: 4210, opened: 2104, clicked: 612, revenue: 18_20_000_00 },
  { id: "cm2", name: "Cart recovery — 1h", channel: "whatsapp", status: "live", audience: "Abandoned carts", sent: 1840, opened: 1520, clicked: 402, revenue: 9_64_000_00 },
  { id: "cm3", name: "Diwali early access", channel: "email", status: "scheduled", audience: "VIP · 860", scheduledFor: "2026-10-18T10:00:00+05:30", sent: 0, opened: 0, clicked: 0, revenue: 0 },
  { id: "cm4", name: "Try-on launch banner", channel: "onsite", status: "paused", audience: "All visitors", sent: 52000, opened: 0, clicked: 3120, revenue: 4_12_000_00 },
  { id: "cm5", name: "Monsoon Edit SMS", channel: "sms", status: "draft", audience: "Mumbai + Pune", sent: 0, opened: 0, clicked: 0, revenue: 0 },
];

export const adminReviews: Review[] = [
  { id: "r1", productId: "p-studio-runner", author: "Aarav M.", rating: 5, title: "Best daily runner", body: "True to size, the suede holds up in rain better than expected.", verifiedPurchase: true, status: "pending", createdAt: "2026-09-23" },
  { id: "r2", productId: "p-core-tee", author: "Isha K.", rating: 4, title: "Heavy and boxy", body: "Great weight. Size down if you want a regular fit.", verifiedPurchase: true, status: "pending", createdAt: "2026-09-24" },
  { id: "r3", productId: "p-daybreak-hoodie", author: "anon_4412", rating: 1, title: "Visit my site for deals", body: "Cheap copies at [link removed].", verifiedPurchase: false, status: "pending", createdAt: "2026-09-25" },
  { id: "r4", productId: "p-cargo", author: "Meera N.", rating: 5, title: "Pockets for days", body: "Fits my phone, keys and a paperback. Olive is lovely.", verifiedPurchase: true, status: "approved", createdAt: "2026-09-12" },
  { id: "r5", productId: "p-boxy-shirt", author: "Sara K.", rating: 2, title: "Shrank after wash", body: "Lost a size after the first cold wash.", verifiedPurchase: true, status: "approved", createdAt: "2026-09-20" },
  { id: "r6", productId: "p-court-low", author: "Guest", rating: 3, title: "Stiff at first", body: "Needed a week to break in.", verifiedPurchase: false, status: "rejected", createdAt: "2026-09-02" },
];

export const adminTestimonials: AdminTestimonial[] = [
  { id: "t1", author: "Kabir Singh", role: "Customer since 2025", quote: "The only tees I rebuy. They survive Pune summers and my washing machine.", status: "published" },
  { id: "t2", author: "Ananya R.", role: "Stylist, Mumbai", quote: "Try-on got the fit of the Studio Runner right before I ordered.", status: "published" },
  { id: "t3", author: "Vikram D.", quote: "Delivery in two days to Guwahati. Packaging was plastic-free.", status: "draft" },
];

export const adminBlogPosts: AdminBlogPost[] = [
  { id: "b1", slug: "how-we-make-heavyweight-tees", title: "How we make our 240 GSM tee", excerpt: "From Tiruppur yarn to your wardrobe.", body: "Our tee starts in Tiruppur…", author: "Editorial", status: "published", publishAt: "2026-09-10T09:00:00+05:30", tags: ["materials"], seo: { title: "How we make our 240 GSM heavyweight tee | wavy Journal", description: "The yarn, knit and wash behind our heavyweight tee." } },
  { id: "b2", slug: "sneaker-care-monsoon", title: "Sneaker care for the monsoon", excerpt: "Keep suede alive through June–September.", body: "Rain and suede are not friends…", author: "Editorial", status: "scheduled", publishAt: "2026-10-01T09:00:00+05:30", tags: ["care", "sneakers"], seo: { title: "Monsoon sneaker care guide | wavy Journal", description: "Five steps to protect suede and leather sneakers in the rain." } },
  { id: "b3", slug: "diwali-gifting", title: "Diwali gifting under ₹3,000", excerpt: "Twelve picks that ship in 48 hours.", body: "", author: "Editorial", status: "draft", tags: ["gifting"], seo: { title: "", description: "" } },
];
