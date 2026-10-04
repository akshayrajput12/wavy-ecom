// Reads the demo content out of supabase/seed.sql (a tiny SQL VALUES parser, no database needed).
// Self-check: `node seed.mjs` parses the real seed and asserts the shape.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Parses `(lit, lit, …), (…)` starting at `i` (just after VALUES). Non-literals (format(), array[…]) come back as { raw }. */
export function parseTuples(sql, i) {
  const rows = [];
  const ws = () => { for (;;) { while (/\s/.test(sql[i])) i++; if (sql.startsWith("--", i)) i = sql.indexOf("\n", i) + 1; else return; } };
  const str = (escapes) => {
    let out = "";
    for (i++; ; i++) {
      const c = sql[i];
      if (c === "'") { if (sql[i + 1] === "'") { out += "'"; i++; continue; } i++; return out; }
      if (escapes && c === "\\") { const n = sql[++i]; out += n === "n" ? "\n" : n === "t" ? "\t" : n; continue; }
      out += c;
    }
  };
  const value = () => {
    ws();
    if (sql[i] === "'") return str(false);
    if (/[Ee]/.test(sql[i]) && sql[i + 1] === "'") { i++; return str(true); }
    const m = /^(-?\d+(?:\.\d+)?|null|true|false)(?=[\s,)])/i.exec(sql.slice(i, i + 40));
    if (m) { i += m[1].length; const w = m[1].toLowerCase(); return w === "null" ? null : w === "true" ? true : w === "false" ? false : Number(w); }
    let depth = 0, start = i;
    for (; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'") { str(false); i--; continue; }
      if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") { if (!depth) break; depth--; }
      else if (c === "," && !depth) break;
    }
    return { raw: sql.slice(start, i).trim() };
  };
  for (;;) {
    ws();
    if (sql[i] !== "(") break;
    i++;
    const row = [];
    for (;;) { row.push(value()); ws(); if (sql[i] === ",") { i++; continue; } if (sql[i] === ")") { i++; break; } throw new Error(`seed.sql: unexpected "${sql.slice(i, i + 20)}"`); }
    rows.push(row);
    ws();
    if (sql[i] === ",") { i++; continue; }
    break;
  }
  return { rows, end: i };
}

const cols = (s) => s.split(",").map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
const objs = (names, rows) => rows.map((r) => Object.fromEntries(names.map((n, k) => [n, r[k]])));
/** `insert into public.<table> (cols) values …` */
function insert(sql, table) {
  const m = new RegExp(`insert into (?:public\\.)?${table}\\s*\\(([^)]*)\\)\\s*values`, "i").exec(sql);
  return m ? objs(cols(m[1]), parseTuples(sql, m.index + m[0].length).rows) : [];
}
/** `… from (values …) as x(a, b)` after `marker` */
function fromValues(sql, marker) {
  const at = sql.indexOf("(values", sql.indexOf(marker)) + "(values".length;
  const { rows, end } = parseTuples(sql, at);
  return objs(cols(/^\s*\)\s*as\s+\w+\(([^)]*)\)/.exec(sql.slice(end))[1]), rows);
}
const pgArray = (v) => (typeof v !== "string" ? null : v.replace(/^\{|\}$/g, "").split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean));
const uuid = (prefix, no) => `${prefix}-0000-4000-8000-${String(no).padStart(12, "0")}`;

export function parseSeed(sql) {
  const store = insert(sql, "store_settings")[0];
  // categories: (no, parent, name, slug, descr, sort)
  const categories = fromValues(sql, "insert into public.categories").map((c) => ({
    id: uuid("10000000", c.no), no: c.no, parent: c.parent, name: c.name, slug: c.slug, description: c.descr, sort: c.sort, showOnHome: c.parent === null, children: [],
  }));
  for (const c of categories) if (c.parent) categories.find((p) => p.no === c.parent).children.push({ id: c.id, name: c.name, slug: c.slug, description: c.description, children: [] });
  const collections = insert(sql, "collections").map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, showOnHome: c.show_on_home, products: [] }));

  const tableDef = /create temp table _seed_products \(([\s\S]*?)\) on commit/.exec(sql)[1];
  const { rows } = parseTuples(sql, sql.indexOf("insert into _seed_products values") + "insert into _seed_products values".length);
  const products = objs(cols(tableDef), rows).map((p) => {
    const c = categories.find((k) => k.no === p.cat);
    const parent = categories.find((k) => k.no === c.parent);
    const sizes = pgArray(p.sizes);
    const colours = JSON.parse(p.colours);
    // deterministic stock from seed.sql: 25 + ((position * 7 + no * 3) % 36) per variant
    const variants = colours.length * (sizes?.length ?? 1);
    let stock = 0;
    for (let v = 1; v <= variants; v++) stock += 25 + ((v * 7 + p.no * 3) % 36);
    return {
      no: p.no, id: uuid("30000000", p.no), name: p.name, slug: p.slug, short: p.short, body: p.descr, highlights: pgArray(p.highlights), specs: JSON.parse(p.specs),
      tags: pgArray(p.tags), badges: pgArray(p.badges), colours: colours.map((x) => ({ v: x.v, hex: x.hex })), sizes, price: p.price, compare: p.compare,
      weight: p.weight, hsn: p.hsn, variants, stock, sku: `WVY-${String(p.no).padStart(2, "0")}`,
      category: { id: c.id, name: c.name, slug: c.slug, parent: parent?.id ?? null, parentName: parent?.name ?? null },
    };
  });
  for (const m of fromValues(sql, "insert into public.collection_products")) {
    const col = collections.find((c) => c.id === uuid("20000000", m.c));
    for (const n of m.ps.raw.match(/\d+/g)) col.products.push(products.find((p) => p.no === +n).slug);
  }
  const zones = insert(sql, "shipping_zones");
  const methods = insert(sql, "shipping_methods").map((m) => ({ ...m, zone: zones.find((z) => z.id === m.zone_id)?.name }));
  const blogCats = insert(sql, "blog_categories");
  const posts = insert(sql, "blog_posts").map((p) => ({
    title: p.title, slug: p.slug, excerpt: p.excerpt, author: p.author_name, minutes: p.reading_minutes,
    category: blogCats.find((c) => c.id === p.category_id)?.name ?? null,
    sections: p.body.split(/^## /m).filter(Boolean).map((s) => { const [h, ...rest] = s.split("\n"); return { heading: h.trim(), body: rest.join(" ").replace(/\*\*/g, "").trim().split(/\s(?=\d+\.\s)/)[0] }; }),
  }));
  const pages = insert(sql, "content_pages").map((p) => ({ slug: p.slug, title: p.title, type: p.page_type, status: p.status, blocks: JSON.parse(p.blocks) }));
  const home = insert(sql, "home_sections").map((s) => ({ ...s, config: JSON.parse(s.config) })).sort((a, b) => a.sort_order - b.sort_order);
  return {
    store, categories, collections, products, zones, methods, posts, pages, home,
    faqs: insert(sql, "faqs"), testimonials: insert(sql, "testimonials").filter((t) => t.is_published),
    coupons: insert(sql, "coupons"), gateways: insert(sql, "payment_gateways"), integrations: insert(sql, "integration_configs"),
    seoOverrides: insert(sql, "seo_overrides"), redirects: insert(sql, "redirects"), blogCategories: blogCats, blogTags: insert(sql, "blog_tags"),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = parseSeed(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase", "seed.sql"), "utf8"));
  const assert = (ok, msg) => { if (!ok) { console.error("✗", msg); process.exit(1); } };
  assert(s.store.store_name === "wavy" && s.store.free_shipping_threshold === 199900, "store settings");
  assert(s.categories.length === 17 && s.categories.find((c) => c.slug === "clothing").children.length === 6, "category tree");
  assert(s.products.length === 23 && s.products[0].name === "Essential Heavyweight Tee" && s.products[0].price === 129900, "products");
  assert(s.products[0].sizes.length === 6 && s.products[17].sizes === null && s.products[1].compare === 239900, "sizes / compare");
  assert(s.products[0].body.includes("\n\n") && s.products[0].colours[0].hex === "#E8E2D4", "E'' strings + colour json");
  assert(s.collections.find((c) => c.slug === "best-sellers").products.length === 8, "collection membership");
  assert(s.home.length === 13 && s.home[0].type === "hero_carousel" && s.home[0].config.slides.length === 4, "home sections");
  assert(s.faqs.length === 7 && s.testimonials.length === 6 && s.posts.length === 3 && s.methods.length === 3, "faqs / testimonials / posts / methods");
  assert(s.faqs[0].answer.includes("You'll"), "'' escapes");
  console.log(`✓ seed: ${s.products.length} products, ${s.categories.length} categories, ${s.collections.length} collections, ${s.home.length} home sections, ${s.posts.length} posts`);
}
