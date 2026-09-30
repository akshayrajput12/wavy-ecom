import type { Review, Testimonial } from "@/types/domain";

type R = [productId: string, author: string, rating: number, title: string, body: string, verified: boolean, date: string];

const rows: R[] = [
  ["p_005", "Aarav M.", 5, "Heavier than I expected — in a good way", "Wore it through a Bengaluru December. Warm without being stuffy, and the hood actually stands up. Size L at 180 cm is roomy but intentional.", true, "2026-08-14"],
  ["p_005", "Ishita R.", 4, "Beautiful colour", "Deep Clay looks richer in person. Sleeves run a little long on me (163 cm) but the rib cuffs hold them in place.", true, "2026-08-02"],
  ["p_005", "Kabir S.", 5, "Worth the price", "Two washes in and zero pilling. The loopback is noticeably denser than anything I've owned.", true, "2026-07-21"],
  ["p_005", "Neha P.", 4, "Great, but size down", "I usually wear M and should have ordered S. Exchange was easy though — pickup came the next day.", false, "2026-07-09"],
  ["p_001", "Rohan K.", 5, "Bought six", "Finally a basic tee that doesn't twist after washing. The 3 for ₹999 deal is silly good.", true, "2026-09-01"],
  ["p_001", "Meera D.", 4, "Soft and opaque", "White isn't see-through, which is rare. Neck is a touch tight on first wear, relaxes quickly.", true, "2026-08-19"],
  ["p_004", "Vikram J.", 5, "The boxy tee I wanted", "Short, wide, heavy. Exactly the shape. Bone colour goes with everything.", true, "2026-08-27"],
  ["p_004", "Tara N.", 5, "Holds its shape", "Feels like a sweatshirt in tee form. Great with the sculpted trousers.", true, "2026-08-11"],
  ["p_008", "Anika B.", 5, "Perfect for Chennai", "Genuinely cool in 36 degrees. Creases, yes, but it's linen.", true, "2026-06-30"],
  ["p_015", "Dev A.", 5, "Better than my Italian pair", "The suede is lovely and the Vibram sole grips on wet marble. True to size.", true, "2026-09-10"],
  ["p_015", "Sana Q.", 5, "Instant favourite", "Comfortable from the first day. Chocolate is gorgeous.", true, "2026-08-25"],
  ["p_016", "Arjun T.", 4, "Clean and classic", "Leather is soft, toe box roomy. Needed a couple of days to break in the heel.", true, "2026-07-30"],
  ["p_018", "Priya V.", 5, "Daily trainer sorted", "Did a half marathon in these. Cushioned without feeling vague.", true, "2026-09-05"],
  ["p_013", "Farhan I.", 5, "Actually waterproof", "Survived a full Mumbai downpour. Pit zips are a lifesaver in the humidity.", true, "2026-08-08"],
];

export const reviews: Review[] = rows.map(([productId, author, rating, title, body, verifiedPurchase, createdAt], i) => ({
  id: `r_${String(i + 1).padStart(3, "0")}`, productId, author, rating, title, body, verifiedPurchase, status: "approved", createdAt,
}));

export const testimonials: Testimonial[] = [
  { id: "t_01", author: "Riya Menon", role: "Architect, Kochi", quote: "The only tees I've found that survive a Kerala summer and still look pressed at 6 pm." },
  { id: "t_02", author: "Aditya Rao", role: "Photographer, Mumbai", quote: "The Studio Low has done three monsoons with me. Resoled once. Still the best-looking thing I own." },
  { id: "t_03", author: "Zoya Khan", role: "Founder, Delhi", quote: "Returns were collected from my door the next morning. That's when I stopped shopping anywhere else." },
];
