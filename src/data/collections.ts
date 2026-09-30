import type { Collection } from "@/types/domain";

const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1200&q=80`, alt });

export const collections: Collection[] = [
  {
    id: "c_monsoon", name: "The Monsoon Edit", slug: "monsoon-edit",
    description: "Quick-dry shells, linen that forgives the humidity, and soles that grip wet stone.",
    image: img("1515886657613-9f3515b0c78f", "Model in a relaxed layered look against a pale wall"),
  },
  {
    id: "c_essentials", name: "Studio Essentials", slug: "studio-essentials",
    description: "The pieces we wear on repeat. Heavy cotton, clean lines, nothing that shouts.",
    image: img("1523381210434-271e8be1f52b", "Folded cotton tees stacked on a table"),
  },
  {
    id: "c_latest_drop", name: "Latest Drop", slug: "latest-drop",
    description: "Drop 04 — limited runs of our newest silhouettes. When they're gone, they're gone.",
    image: img("1552374196-1ab2a1c593e8", "Man in an oversized jacket walking in the city"),
  },
  {
    id: "c_three_for_999", name: "Any 3 for ₹999", slug: "3-for-999",
    description: "Mix any three essentials — tees and tanks — and pay ₹999. Applied automatically in your bag.",
    image: img("1581655353564-df123a1eb820", "Plain cotton t-shirt on a hanger"),
  },
];
