import type { BlogPost } from "@/types/domain";

const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1600&q=80`, alt });

/** Body format: paragraphs separated by blank lines; lines starting with "## " are subheads, "> " are pull quotes. */
export const blogPosts: BlogPost[] = [
  {
    id: "b_001", slug: "why-280-gsm", title: "Why we knit our tees at 280 GSM",
    excerpt: "Weight isn't a vanity number. It decides how a tee drapes, how it breathes, and how long it lasts.",
    cover: img("1434389677669-e08b4cac3105", "Close-up of heavy cotton knit"), author: "Nikhil Rao", publishedAt: "2026-09-12",
    tags: ["Material science"],
    body: `GSM — grams per square metre — is the simplest way to describe how much cotton is in a fabric. Most fast-fashion tees sit around 140. Ours start at 180 and go up to 280.

## Heavier is cooler (really)

It sounds backwards, but a dense, dry-handed jersey often feels cooler in humid weather than a thin one. It stands away from the skin instead of clinging, which lets air move.

> A good tee should feel like it has an opinion about its own shape.

## Slow machines, better cloth

Our heaviest jersey is knitted on loopwheel machines in Tirupur. They run at a fraction of the speed of modern knitting frames, which puts almost no tension on the yarn. The result is a fabric that keeps its shape wash after wash.

We think that's worth the extra cost. After a hundred washes, we think you will too.`,
  },
  {
    id: "b_002", slug: "sneakers-for-the-monsoon", title: "Building a sneaker for the monsoon",
    excerpt: "Three prototypes, two very wet months and one outsole compound we're finally happy with.",
    cover: img("1491553895911-0055eca6402d", "Sneaker outsole detail"), author: "Aisha Varghese", publishedAt: "2026-08-28",
    tags: ["Sneaker engineering"],
    body: `Most sneakers are designed in dry climates for dry pavements. Walk down a Mumbai street in July and you learn quickly which ones weren't built for here.

## The problem is the rubber

Hard rubber lasts longer, but it skates on wet marble and tile. Soft rubber grips, but wears through in a season. We tested eleven compounds before settling on a natural-rubber blend with fine siping across the forefoot.

> We wore the prototypes to every wet railway station we could find.

## Suede that shrugs off water

Our Studio Low uses a suede treated with a fluorine-free water repellent. It won't survive a wade through a flooded underpass, but it will survive the walk home.`,
  },
  {
    id: "b_003", slug: "a-day-in-tirupur", title: "A day in Tirupur",
    excerpt: "We spent a day with the team that cuts and sews every wavy tee. Here's what we learned.",
    cover: img("1558769132-cb1aea458c5e", "Garment workshop with fabric rolls"), author: "Nikhil Rao", publishedAt: "2026-08-05",
    tags: ["Making"],
    body: `Tirupur produces a staggering share of India's knitwear. Our partner workshop is one of the smaller ones: forty people, two floors, and a chai break at exactly 10:30.

## Small batches

We cut in runs of two to three hundred pieces. It's less efficient, but it means we can change a pattern between batches when a fit isn't quite right.

## People, not suppliers

Every person on the floor is paid above the state minimum wage, with health cover. We publish the audit every year on our About page.`,
  },
  {
    id: "b_004", slug: "how-to-care-for-linen", title: "How to care for linen (and learn to love the creases)",
    excerpt: "Linen gets better with every wash — if you let it. A short guide to keeping it soft.",
    cover: img("1596755094514-f87e34085b2c", "Linen shirt"), author: "Aisha Varghese", publishedAt: "2026-07-18",
    tags: ["Care"],
    body: `Linen is the most forgiving fabric we make — and the most misunderstood.

## Wash cold, dry in shade

Hot water and harsh sun make linen brittle. A cold, gentle cycle and a shady line are all it needs.

## Embrace the crease

Linen creases because the fibre is stiff and hollow — which is exactly why it feels so cool. Iron it damp if you must, but a little rumple is part of the look.`,
  },
];
