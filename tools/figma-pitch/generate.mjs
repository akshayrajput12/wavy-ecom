// Statically analyses the wavy repo and embeds a compact screen spec into plugin/code.js (between the
// @generated markers), so the Figma plugin stays one plain JS file with no build step for whoever runs it.
// Usage: cd tools/figma-pitch && npm i && node generate.mjs
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { parseTokens } from "./tokens.mjs";
import { parseSeed } from "./seed.mjs";
import { extractAdmin } from "./admin.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const walk = (dir, test) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p, test) : test(f) ? [p] : []; });
const rel = (p) => relative(ROOT, p).split(sep).join("/");
// same formatter as src/lib/format.ts formatPrice (en-IN, INR, no decimals)
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupees = (paise) => inr.format(paise / 100);

/** Evaluates a TS microcopy module (type-only imports) so arrow-function copy can be called with real values. */
async function loadTs(path) {
  const js = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  if (/^import\s(?!type)/m.test(js)) throw new Error(`${path} has runtime imports; generate.mjs can only evaluate copy modules`);
  return import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
}
const plain = (o) => JSON.parse(JSON.stringify(o)); // drops the copy functions; their results are resolved below

// ---------- repo facts ----------
const pkg = JSON.parse(read("package.json"));
const ver = (n) => (pkg.dependencies?.[n] ?? pkg.devDependencies?.[n] ?? "").replace(/^[\^~]/, "");
const pages = walk(join(ROOT, "src/app"), (f) => f === "page.tsx").map(rel).sort();
const routeOf = (file) => "/" + file.replace(/^src\/app\//, "").replace(/\/?page\.tsx$/, "").split("/").filter((s) => s && !/^\(.*\)$/.test(s)).join("/");
const routes = pages.map((file) => ({ file, route: routeOf(file) }));
const adminRoutes = routes.filter((r) => r.route.startsWith("/admin/"));
const services = readdirSync(join(ROOT, "src/backend")).filter((d) => !d.startsWith("_") && statSync(join(ROOT, "src/backend", d)).isDirectory());
const repo = {
  name: pkg.name,
  tagline: read("README.md").split("\n").find((l, i) => i > 0 && l.trim() && !l.startsWith("#") && !l.includes("·"))?.trim() ?? "",
  stack: [`Next.js ${ver("next")}`, `React ${ver("react")}`, `Tailwind CSS v${ver("tailwindcss").split(".")[0]}`, "TypeScript (strict)", "Supabase", "Framer Motion", "Lenis", "Zod", "Razorpay / PayU", "Shiprocket", "Resend"],
  counts: {
    routes: routes.length,
    storefront: routes.filter((r) => !r.route.startsWith("/admin")).length,
    admin: adminRoutes.length,
    services: services.length,
    apiRoutes: walk(join(ROOT, "src/app/api"), (f) => f === "route.ts").length,
    migrations: readdirSync(join(ROOT, "supabase/migrations")).filter((f) => f.endsWith(".sql")).length,
    components: walk(join(ROOT, "src/components"), (f) => f.endsWith(".tsx")).length,
    views: walk(join(ROOT, "src/views"), (f) => f.endsWith(".tsx")).length,
  },
};

// ---------- tokens, copy, seed ----------
const tokens = parseTokens(read("src/app/globals.css"), read("src/app/layout.tsx"));
const copy = await loadTs("src/data/copy.ts");
const sf = await loadTs("src/data/storefront.ts");
const { co, checkoutSteps3 } = await loadTs("src/views/checkout/copy.ts");
const { ac } = await loadTs("src/views/account/copy.ts");
const { cartExtraCopy } = await loadTs("src/components/commerce/cart/copy.ts");
const seed = parseSeed(read("supabase/seed.sql"));
const store = seed.store;

// ---------- lucide icons (vector paths from node_modules, drawn natively with createNodeFromSvg) ----------
const ICONS = ["search", "heart", "user", "shopping-bag", "menu", "chevron-right", "chevron-left", "chevron-down", "arrow-up-right", "arrow-right",
  "arrow-left", "star", "plus", "minus", "x", "rotate-ccw", "shield-check", "pause", "play", "lock", "map-pin", "locate-fixed", "check", "truck",
  "sliders-horizontal", "external-link", "panel-left-close", "log-out", "package", "credit-card", "smartphone", "landmark", "wallet", "banknote",
  "download", "file-text", "upload", "arrow-up", "arrow-down", "ellipsis", "calendar", "copy", "grip-vertical", "image", "trash-2", "eye",
  "layout-grid", "chart-line", "shirt", "folder-tree", "layers", "boxes", "undo-2", "users", "ticket-percent", "gift", "megaphone",
  "message-square-text", "quote", "house", "newspaper", "circle-help", "globe", "settings", "receipt", "user-cog", "plug", "history",
  "circle-check", "circle-alert", "trending-up", "bell", "mail", "phone", "instagram"];
// presentation attributes repeated on every shape so the SVG importer cannot lose them through inheritance
const STROKE = 'fill="none" stroke="#121211" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
function iconSvg(name) {
  const file = join(ROOT, "node_modules/lucide-react/dist/esm/icons", name + ".mjs");
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const node = src.slice(src.indexOf("node:"), src.indexOf("};", src.indexOf("node:")));
  const shapes = [...node.matchAll(/\[\s*"(\w+)",\s*\{([^}]*)\}/g)].map(([, tag, attrs]) =>
    `<${tag} ${[...attrs.matchAll(/(\w+):\s*"([^"]*)"/g)].filter((a) => a[1] !== "key").map((a) => `${a[1]}="${a[2]}"`).join(" ")} ${STROKE}/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${STROKE}>${shapes.join("")}</svg>`;
}
const icons = Object.fromEntries(ICONS.map((n) => [n, iconSvg(n)]).filter(([, s]) => s));

// ---------- storefront data, resolved with the real copy ----------
const P = seed.products;
const bySlug = Object.fromEntries(P.map((p) => [p.slug, p]));
const card = (p) => ({ name: p.name, slug: p.slug, price: rupees(p.price), compare: p.compare ? rupees(p.compare) : null,
  chip: p.badges[0] ?? p.category.name, hex: p.colours[0]?.hex ?? null, colours: p.colours.map((c) => c.hex), category: p.category.name });
const cat = (slug) => seed.categories.find((c) => c.slug === slug);
const roots = seed.categories.filter((c) => !c.parent);
const hc = sf.homeCopy;

const home = seed.home.map((s) => {
  const c = s.config;
  switch (s.type) {
    case "hero_carousel": return { type: s.type, n: c.slides.length, slides: c.slides.map((x) => ({ eyebrow: x.eyebrow, heading: x.heading, body: x.body, cta: x.cta?.label, cta2: x.secondaryCta?.label, alt: x.imageAlt })) };
    case "category_grid": {
      const cats = (c.categoryIds ?? []).map((id) => seed.categories.find((k) => k.id === id)).filter(Boolean).slice(0, c.limit ?? 24);
      return { type: s.type, overline: hc.overline.categories, title: s.title, subtitle: s.subtitle, viewAll: hc.viewAll,
        tabs: [hc.categoryTabs.all, ...cats.filter((k) => k.children.length).map((k) => k.name)], cards: cats.map((k) => ({ name: k.name, description: k.description })) };
    }
    case "subcategory_grid": return { type: s.type, overline: hc.subcategories.overline, title: s.title, subtitle: s.subtitle, viewAll: hc.viewAll, columns: c.columns ?? 6,
      tiles: roots.filter((r) => r.showOnHome).flatMap((r) => r.children).map((k) => ({ name: k.name, offer: c.showOffer === false ? null : offerText(k), shop: hc.shopNow })) };
    case "product_carousel": return { type: s.type, overline: hc.overline.products[c.source], title: s.title, subtitle: s.subtitle, cta: c.cta?.label ?? null,
      products: (seed.collections.find((k) => k.id === c.collectionId)?.products ?? P.map((p) => p.slug)).slice(0, c.limit ?? 10) };
    case "tear_reveal": return { type: s.type, word: c.word, tagline: c.tagline, cta: c.cta?.label, hint: sf.tearRevealCopy.hint, alt: c.imageAlt };
    case "collection_rail": {
      const cols = (c.collectionIds ?? []).map((id) => seed.collections.find((k) => k.id === id)).filter(Boolean);
      return { type: s.type, overline: s.subtitle ?? sf.homeStageCopy.lookbookOverline, title: s.title, count: sf.homeStageCopy.lookbookCount(cols.length),
        items: cols.map((k) => ({ name: k.name, count: hc.products(k.products.length) })), drag: sf.homeStageCopy.drag };
    }
    case "promo_banner": return { type: s.type, theme: c.theme, overline: s.title, heading: c.heading, body: c.body, cta: c.cta?.label, coupon: c.couponCode ?? null, useCode: hc.useCode, alt: c.imageAlt };
    case "testimonials": return { type: s.type, chip: hc.testimonialsChip, title: s.title, subtitle: s.subtitle, quotes: seed.testimonials.slice(0, c.limit ?? 6) };
    case "blog_rail": return { type: s.type, overline: hc.overline.blog, title: s.title, viewAll: hc.viewAll, posts: seed.posts.slice(0, c.limit ?? 3).map(postCard) };
    case "newsletter": return { type: s.type, overline: s.title, heading: c.heading, body: c.body, placeholder: c.placeholder, button: c.buttonLabel, consent: c.consentText };
    default: return { type: s.type, title: s.title };
  }
});
// FAQ preview sits before a closing newsletter band (HomeView)
const faqPreview = { type: "faq_preview", ...hc.faq, faqs: seed.faqs.slice(0, 5).map((f) => ({ q: f.question, a: f.answer })) };
home.splice(home.at(-1)?.type === "newsletter" ? home.length - 1 : home.length, 0, faqPreview);

function offerText(k) {
  const ids = [k.id, ...k.children.map((x) => x.id)];
  const ps = P.filter((p) => ids.includes(p.category.id));
  if (!ps.length) return null;
  const pct = Math.floor(Math.max(...ps.map((p) => (p.compare ? ((p.compare - p.price) / p.compare) * 100 : 0))) / 5) * 5;
  return pct >= 5 ? hc.subcategories.upTo(pct) : hc.subcategories.from(rupees(Math.min(...ps.map((p) => p.price))));
}
function postCard(p) { return { title: p.title, excerpt: p.excerpt, category: p.category, minutes: copy.blogCopy.minRead(p.minutes), author: p.author, slug: p.slug }; }

const nav = { roots: [...roots.map((r) => r.name), copy.headerCopy.collections],
  footer: [
    { title: copy.footerCopy.shop, links: [...roots.map((r) => r.name), copy.headerCopy.collections] },
    { title: copy.footerCopy.help, links: [copy.footerCopy.faq, copy.footerCopy.track, copy.footerCopy.account] },
    { title: copy.footerCopy.company, links: [copy.footerCopy.blog, ...seed.pages.filter((p) => p.slug !== "faq").map((p) => p.title)] },
  ],
  blurb: copy.footerCopy.newsletterTitle, newsletter: copy.footerCopy.newsletterLabel, subscribe: copy.footerCopy.newsletterCta,
  rights: sf.layoutCopy.rights(new Date().getFullYear(), store.store_name), support: store.support_email, top: copy.footerCopy.backToTop,
  freeShipping: sf.layoutCopy.freeShipping(rupees(store.free_shipping_threshold)) };

// PDP, PLP, cart, checkout: one real product / collection each, every string from the copy modules
const pdpP = bySlug["essential-heavyweight-tee"] ?? P[0];
const plpCat = cat("clothing") ?? roots[0];
const plpProducts = P.filter((p) => [plpCat.id, ...plpCat.children.map((c) => c.id)].includes(p.category.id));
const cartLines = [bySlug["waxed-cotton-field-jacket"], bySlug["court-classic-leather-sneaker"], bySlug["washed-cotton-cap"]].filter(Boolean)
  .map((p, i) => ({ ...card(p), option: [p.colours[0]?.v, p.sizes ? p.sizes[Math.min(2, p.sizes.length - 1)] : null].filter(Boolean).join(" / "), qty: i === 2 ? 2 : 1, unit: p.price }));
const subtotal = cartLines.reduce((n, l) => n + l.unit * l.qty, 0);
const ship = subtotal >= store.free_shipping_threshold ? 0 : seed.methods[0]?.rate ?? store.flat_shipping_fee;
const gstOf = (gross) => Math.round(gross - gross / (1 + store.tax_percentage / 100));
const totals = { subtotal: rupees(subtotal), shipping: ship ? rupees(ship) : copy.cartCopy.free, total: rupees(subtotal + ship), gst: rupees(gstOf(subtotal + ship)) };

const fy = (() => { const d = new Date(); const s = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${s}-${String((s + 1) % 100).padStart(2, "0")}`; })();
const series = /INVOICE_SERIES = "(\w+)"/.exec(read("src/backend/invoices/gst.ts"))?.[1] ?? "INV";
const orderSeq = Number(/order_number_seq start (\d+)/.exec(read("supabase/migrations/0005_orders_payments.sql"))?.[1] ?? 100001);
const orderNo = (i) => `wavy-${orderSeq + i}`;

const storefront = {
  nav, home,
  products: Object.fromEntries(P.map((p) => [p.slug, card(p)])),
  collectionsIndex: { title: copy.collectionsIndexCopy.title, items: seed.collections.map((k) => ({ name: k.name, description: k.description, count: hc.products(k.products.length) })) },
  plp: { title: plpCat.name, description: plpCat.description, crumbs: [copy.productCopy.breadcrumbHome, plpCat.name], count: copy.filterCopy.results(plpProducts.length),
    strip: plpCat.children.map((c) => c.name), filters: copy.filterCopy.filters, sort: copy.sortOptions[0].label, products: plpProducts.map((p) => p.slug),
    panel: { title: copy.filterCopy.filters, groups: [[copy.filterCopy.category, plpCat.children.map((c) => c.name)], [copy.filterCopy.brand, [store.store_name]],
      [copy.filterCopy.price, [copy.filterCopy.minPrice, copy.filterCopy.maxPrice]], [copy.filterCopy.availability, [copy.filterCopy.inStock]]],
      clear: copy.filterCopy.clearAll, apply: `${copy.filterCopy.apply} (${plpProducts.length})` } },
  pdp: { ...card(pdpP), crumbs: [copy.productCopy.breadcrumbHome, pdpP.category.parentName, pdpP.category.name].filter(Boolean), overline: pdpP.category.name,
    short: pdpP.short, inclusive: copy.productCopy.inclusive, highlights: pdpP.highlights, specs: pdpP.specs, colours: pdpP.colours, sizes: pdpP.sizes,
    sizeLabel: copy.productCopy.select("Size"), colourLabel: copy.productCopy.select("Colour"), addToBag: copy.productCopy.addToBag, inStock: copy.productCopy.inStock,
    quantity: sf.pdpCopy.quantity, delivery: { title: copy.deliveryCopy.title, label: copy.deliveryCopy.label, placeholder: copy.deliveryCopy.placeholder, cta: copy.deliveryCopy.cta },
    returns: copy.productCopy.returns, returnable: copy.productCopy.returnable(store.return_window_days), details: sf.pdpCopy.details, description: copy.productCopy.description,
    highlightsTitle: copy.productCopy.highlights, specsTitle: copy.productCopy.specifications, reviews: { title: copy.reviewsCopy.title, empty: copy.reviewsCopy.empty, write: copy.reviewsCopy.write },
    relatedOverline: copy.productCopy.relatedOverline, related: copy.productCopy.related, viewAll: copy.productCopy.viewAll,
    relatedProducts: P.filter((p) => p.category.id === pdpP.category.id && p.slug !== pdpP.slug).concat(P.filter((p) => p.category.parent === pdpP.category.parent && p.category.id !== pdpP.category.id)).slice(0, 4).map((p) => p.slug) },
  search: { placeholder: copy.searchCopy.placeholder, q: "leather", results: (() => { const r = P.filter((p) => /leather/i.test(p.name + p.short)); return { title: copy.searchCopy.resultsFor("leather", r.length), products: r.map((p) => p.slug) }; })(),
    recentTitle: copy.searchCopy.recentTitle, shortcuts: copy.searchCopy.shortcutsTitle, categories: roots.map((r) => r.name) },
  wishlist: { title: copy.wishlistCopy.title, note: copy.wishlistCopy.guestNote, products: ["satin-slip-midi-dress", "suede-penny-loafer", "everyday-leather-tote", "merino-crew-knit"].filter((s) => bySlug[s]),
    move: copy.wishlistCopy.moveToBag, remove: copy.wishlistCopy.remove },
  cart: { title: copy.cartCopy.title, lines: cartLines.map((l) => ({ ...l, line: rupees(l.unit * l.qty) })), totals, labels: copy.cartCopy,
    free: subtotal >= store.free_shipping_threshold ? cartExtraCopy.freeUnlocked : cartExtraCopy.freeLeft(rupees(store.free_shipping_threshold - subtotal)),
    count: cartLines.reduce((n, l) => n + l.qty, 0) },
  blog: { ...plain(copy.blogCopy), posts: seed.posts.map(postCard), article: { ...postCard(seed.posts[0]), sections: seed.posts[0].sections } },
  faq: { ...plain(copy.faqPageCopy), topics: [...new Set(seed.faqs.map((f) => f.category))], faqs: seed.faqs.map((f) => ({ q: f.question, a: f.answer, topic: f.category })) },
  about: seed.pages.find((p) => p.slug === "about"),
  notFound: { ...copy.pageStates.notFound, word: sf.tearRevealCopy.notFoundWord, browse: sf.collectionCopy.browse },
};

// checkout + account: illustrative customer (no customers are seeded), real copy and real seed products/methods
const customer = { name: "Ananya Rao", email: "ananya@example.com", phone: "98xxxxxx10", line1: "14, Lake View Apartments, MG Road", city: "Pune", state: "Maharashtra", pin: "411001" };
const orders0 = [
  { no: orderNo(23), date: "28 Sep 2026", status: copy.orderStatusLabels.shipped, items: 2, total: rupees(bySlug["waxed-cotton-field-jacket"].price + bySlug["washed-cotton-cap"].price), products: ["waxed-cotton-field-jacket", "washed-cotton-cap"] },
  { no: orderNo(17), date: "12 Sep 2026", status: copy.orderStatusLabels.delivered, items: 1, total: rupees(bySlug["satin-slip-midi-dress"].price), products: ["satin-slip-midi-dress"] },
  { no: orderNo(9), date: "30 Aug 2026", status: copy.orderStatusLabels.returned, items: 1, total: rupees(bySlug["rigid-straight-selvedge-jeans"].price), products: ["rigid-straight-selvedge-jeans"] },
];
const orders = orders0.map((o) => ({ ...o, title: ac.order(o.no), placed: ac.placed(o.date) }));
const account = {
  customer, orders, nav: copy.accountNav.map((n) => n.label), ac: plain(ac), co: plain(co), checkoutCopy: plain(copy.checkoutCopy),
  hello: ac.hello(customer.name.split(" ")[0]), memberSince: ac.memberSince("Mar 2026"), openReturns: ac.openReturns(1),
  steps: [...checkoutSteps3], stepOf: checkoutSteps3.map((_, i) => copy.checkoutCopy.stepOf(i + 1, checkoutSteps3.length)),
  methods: seed.methods.filter((m) => m.zone === "Metro").map((m) => ({ name: m.name, days: co.delivery.days(m.min_days, m.max_days), rate: subtotal >= store.free_shipping_threshold ? copy.cartCopy.free : rupees(m.rate), description: m.description })),
  gateways: seed.gateways.filter((g) => g.is_enabled).map((g) => ({ name: g.display_name, description: g.description, provider: g.provider })),
  payLabel: co.payment.pay(totals.total), trust: [co.trust.secure, co.trust.razorpay, co.trust.returns(store.return_window_days)], summaryItems: co.summary.items(cartLines.reduce((n, l) => n + l.qty, 0)),
  map: { title: copy.addressCopy.map.title, subtitle: copy.addressCopy.map.subtitle, search: copy.addressCopy.map.searchPlaceholder, locate: copy.addressCopy.map.locate,
    pinned: copy.addressCopy.map.pinnedAt, use: copy.addressCopy.map.use, accuracy: copy.addressCopy.map.accuracy("±12 m"), live: copy.addressCopy.map.live, drag: copy.addressCopy.map.drag, useLocation: copy.addressCopy.useLocation },
  invoice: { number: `${series}/${fy}/000124`, labels: plain(copy.invoiceCopy), seller: store.store_name, gstRate: store.tax_percentage, inclusive: store.tax_inclusive },
  success: { title: copy.checkoutCopy.successTitle, emailed: co.success.emailed(customer.email), order: orderNo(24), guest: copy.checkoutCopy.guestPrompt },
  auth: plain(copy.authCopy), returnReasons: Object.values(copy.returnReasonLabels), returnNext: ac.returnNext, trackTitle: ac.trackTitle(orderNo(23)),
  arriving: ac.arriving("2 Oct 2026"), toCity: ac.to(customer.city), requestReturn: copy.accountCopy.requestReturn,
  pinHint: `${co.address.eta(co.delivery.days(seed.methods[1]?.min_days ?? 2, seed.methods[1]?.max_days ?? 4))} · ${co.address.cod}`, shipmentSteps: Object.values(ac.steps), carrier: "Shiprocket", awb: "SR1234567890",
  returnRef: "RET-2026-0042", returnFor: ac.returnFor(orderNo(17)), requested: ac.requested("14 Sep 2026"), refund: ac.refund(rupees(bySlug["satin-slip-midi-dress"].price)),
};

// ---------- admin IA (nav, every route, its fields/columns) + seed/illustrative rows ----------
const admin = extractAdmin({ ROOT, read, adminRoutes, seed, copy, rupees, orderNo, customerNames: seed.testimonials.map((t) => t.author_name) });

// StatusBadge tones (components/ui/Badge.tsx), keyed by status and by its shopper/admin label
const badge = read("src/components/ui/Badge.tsx");
const statusTone = Object.fromEntries([...badge.slice(badge.indexOf("STATUS_TONE"), badge.indexOf("};", badge.indexOf("STATUS_TONE"))).matchAll(/(\w+): "(\w+)"/g)].map((m) => [m[1], m[2]]));
for (const labels of [copy.orderStatusLabels, copy.paymentStatusLabels, copy.shipmentStatusLabels])
  for (const [k, label] of Object.entries(labels)) if (statusTone[k]) statusTone[label.toLowerCase()] ??= statusTone[k];

// admin Tax "Preview" panel: the view's SAMPLE through its gstBreakdown (views/admin/tax), at the seed GST rate
const taxSrc = read("src/views/admin/tax/View.tsx");
const sample = Number(/const SAMPLE = (\d+)/.exec(taxSrc)?.[1] ?? 100000);
const base = store.tax_inclusive ? Math.round(sample / (1 + store.tax_percentage / 100)) : sample;
const tax = store.tax_inclusive ? sample - base : Math.round((sample * store.tax_percentage) / 100), half = Math.floor(tax / 2);
const taxPreview = { description: `On a ${rupees(sample)} item`, rows: [["Base", rupees(base)], ["CGST", rupees(half)], ["SGST", rupees(tax - half)], ["Total", rupees(base + tax)]] };

// ---------- write ----------
const spec = { generatedAt: new Date().toISOString(), repo, tokens, icons, storefront, account, admin,
  ui: { header: plain(copy.headerCopy), filter: plain(copy.filterCopy), product: plain(copy.productCopy), cart: plain(copy.cartCopy), states: plain(copy.pageStates),
    search: plain(copy.searchCopy), wishlist: plain(copy.wishlistCopy), home: plain(hc), stage: plain(sf.homeStageCopy), pagination: plain(sf.paginationCopy),
    admin: plain(copy.adminCopy), statuses: plain(copy.orderStatusLabels), pay: plain(copy.paymentStatusLabels), statusTone, footer: plain(copy.footerCopy),
    // copy functions as templates: the plugin swaps the sentinel numbers for its own
    tpl: { selected: copy.adminCopy.table.selected(222), range: copy.adminCopy.table.range(111, 222, 333) }, taxPreview } };
const json = JSON.stringify(spec);
const codePath = join(HERE, "plugin", "code.js");
const code = readFileSync(codePath, "utf8");

// guards: fail loudly when the analysis stops finding what the board is built from
const need = (ok, msg) => { if (!ok) throw new Error("generate.mjs: " + msg); };
need(admin.nav.length && admin.nav.every((g) => g.items.length), "admin nav (ADMIN_NAV in views/admin/rbac.ts) not found");
need(admin.screens.length === adminRoutes.length && admin.screens.every((s) => s.title), "every /admin route needs a title");
need(admin.screens.find((s) => s.route === "/admin/products")?.sections.some((x) => x.tables.some((t) => t.columns.includes("Product"))), "products list columns not found");
need(admin.screens.find((s) => s.route === "/admin/products/new")?.sections.some((x) => x.title === "Basics" && x.fields.length > 3), "product editor fields not found");
need(home.length > 2 && P.length && seed.categories.length, "seed.sql home sections / products / categories not found");
const usedIcons = [...new Set([...code.matchAll(/\bIB?\("([a-z0-9-]+)"/g)].map((m) => m[1]).concat(admin.nav.flatMap((g) => g.items.map((i) => i.icon))))];
need(usedIcons.every((i) => icons[i]), "icons missing (add them to ICONS): " + usedIcons.filter((i) => !icons[i]).join(", "));
const START = "/* @generated-spec-start (node generate.mjs) */", END = "/* @generated-spec-end */";
const a = code.indexOf(START), b = code.indexOf(END);
if (a < 0 || b < a) throw new Error("plugin/code.js is missing the @generated-spec markers");
writeFileSync(codePath, code.slice(0, a + START.length) + "\n/** @type {any} */\nvar SPEC = " + json + ";\n" + code.slice(b));
const n = (k) => admin.screens.filter((s) => s.kind === k).length;
console.log(`✓ spec ${(json.length / 1024).toFixed(0)} KB → plugin/code.js (${(statSync(codePath).size / 1024).toFixed(0)} KB)`);
console.log(`  ${repo.counts.routes} routes · ${P.length} products · ${seed.categories.length} categories · ${seed.collections.length} collections · ${home.length} home sections · ${Object.keys(icons).length} icons`);
console.log(`  admin: ${admin.nav.length} nav groups, ${admin.screens.length} screens (${["list", "editor", "settings", "detail", "dashboard", "analytics", "home"].map((k) => `${n(k)} ${k}`).join(", ")})`);
if (process.argv.includes("--debug")) for (const s of admin.screens) console.log(` ${s.route.padEnd(36)} ${s.kind.padEnd(9)} ${s.title} | ${s.sections.map((x) => `${x.title ?? "·"}[${x.fields.length}f${x.tables.map((t) => t.columns.length + "c").join("")}]`).join(" ")} | rows:${s.rows?.source ?? "-"}`);
