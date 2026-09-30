/** Storefront navigation + footer link lists. */
export const mainNav = [
  { label: "New In", href: "/new-in" },
  { label: "Clothing", href: "/collections/clothing" },
  { label: "Sneakers", href: "/collections/sneakers" },
  { label: "Collections", href: "/collections" },
  { label: "Journal", href: "/journal" },
] as const;

export const announcements = [
  "Free shipping across India on orders above ₹2,999",
  "10-day doorstep returns & exchanges",
  "Any 3 essentials for ₹999",
] as const;

export const headerCopy = {
  search: "Search",
  wishlist: "Wishlist",
  account: "Account",
  bag: "Bag",
  menu: "Open menu",
  closeMenu: "Close menu",
  mobileExtra: [
    { label: "Lookbook", href: "/lookbook" },
    { label: "About", href: "/about" },
    { label: "Help & FAQ", href: "/faq" },
  ],
} as const;

export const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "New In", href: "/new-in" },
      { label: "Clothing", href: "/collections/clothing" },
      { label: "Sneakers", href: "/collections/sneakers" },
      { label: "Any 3 for ₹999", href: "/collections/3-for-999" },
      { label: "Lookbook", href: "/lookbook" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping & delivery", href: "/faq#shipping" },
      { label: "Returns & exchanges", href: "/faq#returns" },
      { label: "Track an order", href: "/account/orders" },
    ],
  },
  {
    title: "wavy",
    links: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Editorial", href: "/editorial" },
      { label: "Account", href: "/account" },
    ],
  },
] as const;

export const footerCopy = {
  newsletterTitle: "Letters from the studio",
  newsletterBody: "New drops, restocks and the occasional essay. Twice a month, never more.",
  newsletterLabel: "Email address",
  newsletterCta: "Subscribe",
  newsletterThanks: "You're on the list. See you in your inbox.",
  legal: "Designed in Bengaluru. Made in India.",
} as const;
