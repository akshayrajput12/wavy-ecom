// Admin information architecture, read statically from the code: the nav (views/admin/rbac.ts), and for every
// src/app/admin/**/page.tsx its View's page header, panels/form sections, field labels, table columns, filters
// and buttons (regex + a small JSX attribute scanner, following the view's own component imports).
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase();
const UI_TAGS = new Set(["Button", "ButtonLink", "Badge", "StatusBadge", "Link", "Image", "PageHeader", "Panel", "FormSection", "DataTable", "SimpleTable",
  "SelectBox", "RemoveButton", "BulkBar", "EmptyState", "Skeleton", "EditorForm", "BackLink", "DeleteButton", "Fragment", "ChartCard", "StatCard", "TrendChart",
  "DefinitionList", "Dialog", "Drawer", "Modal", "IconMotion", "Reveal", "Stagger", "StaggerItem"]);
const NOT_FIELDS = new Set(["SelectBox", "RemoveButton", "DeleteButton", "DeleteDialog", "Badge", "Button", "ButtonLink", "Chip", "BulkBar", "Link", "TrendChart", "Bars", "BarList"]);
const CONTROL = { Select: "select", Textarea: "textarea", Toggle: "toggle", ItemPicker: "picker", ImagePick: "image", ImageDropzone: "image", CoverField: "image", Combobox: "select", TargetPicker: "picker" };

/** Scans a JSX opening tag from `<` at i; returns its attribute text and the index after `>` (or `/>`). */
function tagAt(t, i) {
  let depth = 0, q = null;
  for (let k = i + 1; k < t.length; k++) {
    const c = t[k];
    if (q) { if (c === q && t[k - 1] !== "\\") q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { if (depth || c === '"') q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && !depth) return { attrs: t.slice(i, k), end: k + 1, selfClosing: t[k - 1] === "/" };
  }
  return { attrs: t.slice(i), end: t.length, selfClosing: true };
}
/** A top-level attribute of a tag (not one nested inside another attribute's JSX). */
function attr(attrs, name) {
  let k = -1;
  for (let i = 0, depth = 0, q = null; i < attrs.length; i++) {
    const c = attrs[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' && !depth) { q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (!depth && /\s/.test(c) && attrs.startsWith(name + "=", i + 1)) { k = i + 1 + name.length + 1; break; }
  }
  if (k < 0) return null;
  if (attrs[k] === '"') return { lit: attrs.slice(k + 1, attrs.indexOf('"', k + 1)) };
  if (attrs[k] !== "{") return null;
  let depth = 0;
  for (let e = k; e < attrs.length; e++) { if (attrs[e] === "{") depth++; else if (attrs[e] === "}" && !--depth) return { expr: attrs.slice(k + 1, e) }; }
  return null;
}
/** The first human-readable string literal in an expression (capitalised ones win over keys like "percent"). */
const firstLit = (s) => {
  const lits = [...(s ?? "").matchAll(/"([^"]*[A-Za-z][^"]*)"|`([^`$]*[A-Za-z][^`$]*)/g)].map((m) => (m[1] ?? m[2]).trim()).filter(Boolean);
  return lits.find((l) => /^[A-Z]/.test(l)) ?? lits[0] ?? null;
};
const text = (a) => (a ? a.lit ?? firstLit(a.expr) : null);
/** Literal text children of the element starting at `end` (stops at the closing tag). */
function children(t, end, tag) {
  const close = t.indexOf(`</${tag}>`, end);
  if (close < 0) return null;
  const s = t.slice(end, close).replace(/\{[^{}]*\}/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return /[A-Za-z]/.test(s) ? s : null;
}
function balanced(t, k, open = "[", close = "]") {
  let depth = 0;
  for (let e = k; e < t.length; e++) { if (t[e] === open) depth++; else if (t[e] === close && !--depth) return t.slice(k + 1, e); }
  return "";
}
const headersIn = (s) => [...s.matchAll(/header:\s*(?:"([^"]*)"|([\w.]+))/g)].map((m) => m[1] ?? "");

export function extractAdmin({ ROOT, read, adminRoutes, seed, copy, rupees, orderNo, customerNames }) {
  const files = new Map();
  const load = (abs) => {
    if (files.has(abs)) return files.get(abs);
    const t = read(abs.slice(ROOT.length + 1));
    const imports = new Map();
    for (const m of t.matchAll(/import\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
      const path = resolve(abs, m[2]);
      if (path) for (const n of m[1].split(",")) { const name = n.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop(); if (name) imports.set(name, path); }
    }
    const comps = new Map();
    const decl = [...t.matchAll(/^(?:export\s+)?(?:function\s+([A-Z]\w*)|const\s+([A-Z]\w*)\s*=\s*\()/gm)];
    decl.forEach((m, k) => comps.set(m[1] ?? m[2], t.slice(m.index, decl[k + 1]?.index ?? t.length)));
    const f = { abs, t, imports, comps };
    files.set(abs, f);
    return f;
  };
  function resolve(from, spec) {
    let base;
    if (spec.startsWith(".")) base = join(dirname(from), spec);
    else if (spec.startsWith("@/views/admin/") || spec === "@/components/admin/SeoFields") base = join(ROOT, "src", spec.slice(2));
    else return null;
    for (const ext of [".tsx", ".ts", "/index.tsx"]) if (existsSync(base + ext)) return base + ext;
    return null;
  }

  /** Ordered UI events of one component (expanding the admin-local components it renders). */
  function events(file, name, seen = new Set()) {
    const key = file.abs + "#" + name;
    if (seen.has(key) || seen.size > 40) return [];
    seen.add(key);
    const body = file.comps.get(name);
    if (!body) return [];
    const out = [];
    const re = /<([A-Za-z][\w.]*)\b|\b(?:text|f|n|num|field)\("\w+",\s*"([^"]+)"(?:,\s*"([^"]+)")?/g;
    let m;
    while ((m = re.exec(body))) {
      if (m[2]) { out.push({ e: "field", label: m[2], control: "input", hint: m[3] ?? null }); continue; }
      const tag = m[1];
      const { attrs, end } = tagAt(body, m.index);
      const label = text(attr(attrs, "label"));
      if (tag === "PageHeader") {
        const acts = attr(attrs, "actions")?.expr ?? "";
        out.push({ e: "header", title: text(attr(attrs, "title")), description: text(attr(attrs, "description")),
          actions: [...acts.matchAll(/<(?:Button|ButtonLink)\b[^>]*>([^<{]*[A-Za-z][^<{]*)</g)].map((x) => x[1].trim()),
          selects: [...acts.matchAll(/<Select\s+label="([^"]+)"/g)].map((x) => x[1]) });
        re.lastIndex = end;
      } else if (tag === "Panel" || tag === "FormSection" || tag === "ChartCard") {
        out.push({ e: "section", title: text(attr(attrs, "title")), description: text(attr(attrs, "description")), chart: tag === "ChartCard" });
      } else if ((tag === "h2" || tag === "h3") && children(body, end, tag)) {
        out.push({ e: "section", title: children(body, end, tag) });
      } else if (tag === "legend" && children(body, end, tag) && !/sr-only/.test(attrs)) {
        out.push({ e: "field", label: children(body, end, tag), control: "group" });
      } else if (tag === "thead") {
        const close = body.indexOf("</thead>", end);
        const head = body.slice(end, close);
        const cols = [...head.matchAll(/\[((?:\s*"[^"]*",?)+)\s*\]\.map\(|<th\b[^>]*>([^<{]*)</g)].flatMap((x) => (x[1] ? [...x[1].matchAll(/"([^"]*)"/g)].map((y) => y[1]) : [x[2].trim()]));
        if (cols.length) out.push({ e: "table", columns: cols });
        re.lastIndex = close;
      } else if (attr(attrs, "columns") || attr(attrs, "cols")) {
        const ref = (attr(attrs, "columns") ?? attr(attrs, "cols")).expr.trim();
        let src = ref.startsWith("[") ? ref : "";
        if (!src) { const d = new RegExp(`const ${ref}\\b[^=]*=\\s*\\[`).exec(file.t); if (d) src = balanced(file.t, d.index + d[0].length - 1); }
        const filters = attr(attrs, "filters")?.expr ?? "";
        out.push({ e: "table", columns: headersIn(src), caption: text(attr(attrs, "caption")), search: text(attr(attrs, "searchPlaceholder")) ?? (attr(attrs, "search") ? copy.adminCopy.table.search : null),
          filters: [...filters.matchAll(/label:\s*"([^"]+)"/g)].map((x) => x[1]), bulk: !!attr(attrs, "bulkActions"), empty: firstLit(attr(attrs, "empty")?.expr) });
        re.lastIndex = end;
      } else if ((tag === "Button" || tag === "ButtonLink") && children(body, end, tag)) {
        out.push({ e: "button", label: children(body, end, tag), secondary: /variant="(secondary|ghost)"/.test(attrs) });
      } else if (label && !NOT_FIELDS.has(tag) && /^[A-Z]/.test(tag)) {
        out.push({ e: "field", label, control: CONTROL[tag] ?? (/type="(date|datetime-local)"/.test(attrs) ? "date" : "input"), hint: text(attr(attrs, "hint")), value: text(attr(attrs, "placeholder")) });
      } else if (tag === "StatCard") out.push({ e: "kpis" });
      const fl = attr(attrs, "filters");
      if (fl?.expr && !attr(attrs, "columns")) out.push({ e: "filters", labels: [...fl.expr.matchAll(/label:\s*"([^"]+)"/g)].map((x) => x[1]) });
      if (/^[A-Z]/.test(tag) && !UI_TAGS.has(tag)) {
        if (file.comps.has(tag) && tag !== name) out.push(...events(file, tag, seen));
        else if (file.imports.has(tag)) out.push(...events(load(file.imports.get(tag)), tag, seen));
      }
    }
    return out;
  }

  // ---------- nav ----------
  const rbac = read("src/views/admin/rbac.ts");
  const navSrc = balanced(rbac, rbac.indexOf("= [", rbac.indexOf("ADMIN_NAV")) + 2);
  const nav = [...navSrc.matchAll(/\{\s*label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\]\s*\}/g)].map((g) => ({
    label: g[1], items: [...g[2].matchAll(/label:\s*"([^"]+)",\s*href:\s*"([^"]+)",[^}]*icon:\s*(\w+)/g)].map((i) => ({ label: i[1], href: i[2], icon: kebab(i[3]) })),
  }));
  const items = nav.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
  const navFor = (route) => items.filter((i) => route === i.href || route.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0];
  const roleLabel = /super_admin:\s*"([^"]+)"/.exec(rbac)?.[1] ?? "Super admin";
  const kpis = [...read("src/backend/admin/dashboard.ts").matchAll(/\{\s*id:\s*"(\w+)",\s*label:\s*"([^"]+)"[^}]*format:\s*"(\w+)"/g)].map((m) => ({ id: m[1], label: m[2], format: m[3] }));

  // home-section editor: type labels + per-type config field labels (ConfigFields.tsx `case "type":` blocks)
  const sc = read("src/views/admin/home-sections/SectionCard.tsx");
  const sectionLabels = Object.fromEntries([...balanced(sc, sc.indexOf("{", sc.indexOf("SECTION_LABEL")), "{", "}").matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const cf = read("src/views/admin/home-sections/ConfigFields.tsx");
  const hero = [...read("src/views/admin/home-sections/HeroFields.tsx").matchAll(/label="([^"]+)"/g)].map((m) => m[1]);
  const sectionFields = Object.fromEntries(cf.split(/case "/).slice(1).map((chunk) => { const type = chunk.slice(0, chunk.indexOf('"')); return [type, type === "hero_carousel" ? hero : [...chunk.matchAll(/label="([^"]+)"/g)].map((m) => m[1])]; }));
  const cardFields = [...sc.matchAll(/<(?:Input|Toggle)\s+label="([^"]+)"/g)].map((m) => m[1]);

  // ---------- every admin route ----------
  const screens = adminRoutes.map(({ file, route }) => {
    const page = read(file);
    const meta = /metadata\s*=\s*\{\s*title:\s*"([^"]+)"/.exec(page)?.[1];
    const comp = /return\s*\(?\s*<([A-Z]\w*)/.exec(page)?.[1];
    const pf = load(join(ROOT, file));
    const ev = comp && pf.imports.has(comp) ? events(load(pf.imports.get(comp)), comp) : [];
    const head = ev.find((e) => e.e === "header" && e.title) ?? { title: meta, description: null, actions: [] };
    const sections = [];
    let cur = null;
    const section = (s) => { cur = { title: s?.title ?? null, description: s?.description ?? null, chart: !!s?.chart, fields: [], tables: [], buttons: [], filters: [] }; sections.push(cur); };
    for (const e of ev) {
      if (e.e === "section") { section(e); continue; }
      if (e.e === "header" || e.e === "kpis") continue;
      if (!cur) section(null);
      if (e.e === "field" && !cur.fields.some((f) => f.label === e.label)) cur.fields.push({ label: e.label, control: e.control, hint: e.hint ?? null, value: e.value ?? null });
      if (e.e === "table") cur.tables.push(e);
      if (e.e === "filters") cur.filters.push(...e.labels);
      if (e.e === "button" && !head.actions.includes(e.label) && !cur.buttons.includes(e.label)) cur.buttons.push(e.label);
    }
    const seg = route.split("/");
    const kind = /\/(new|edit)$/.test(route) ? "editor" : route === "/admin/dashboard" ? "dashboard" : route === "/admin/analytics" ? "analytics" : route === "/admin/home" ? "home"
      : /\[\w+\]$/.test(route) ? "detail" : sections.some((s) => s.tables.length) ? "list" : sections.reduce((k, s) => k + s.fields.length, 0) > 2 ? "settings" : "list";
    const n = navFor(route);
    const viewSrc = comp && pf.imports.has(comp) ? load(pf.imports.get(comp)).t : "";
    const viewKpis = [...viewSrc.matchAll(/\{\s*id:\s*"\w+",\s*label:\s*"([^"]+)"[^}]*format:\s*"(\w+)"/g)].map((x) => ({ label: x[1], format: x[2] }));
    return { route, file, kind, title: meta ?? head.title, pageTitle: head.title ?? meta, description: head.description, actions: head.actions, selects: head.selects ?? [], nav: n?.label ?? null, group: n?.group ?? null,
      kpis: ev.some((e) => e.e === "kpis") ? (viewKpis.length ? viewKpis : kpis.map((k) => ({ label: k.label, format: k.format }))) : [],
      crumbs: [copy.adminCopy.root, n?.label, ...seg.slice(n ? n.href.split("/").length : 2).map((s) => (s === "new" ? copy.adminCopy.newCrumb : s === "edit" ? null : s.startsWith("[") ? "…" : s))].filter(Boolean),
      sections: sections.filter((s) => s.title || s.fields.length || s.tables.length || s.buttons.length), hasKpis: ev.some((e) => e.e === "kpis") };
  });
  for (const s of screens) {
    s.rows = rowsFor(s, { seed, rupees, orderNo, customerNames, copy });
    fillTables(s);
    // editors open on a real seed record (its name is the H1, fields show its values); /new shows the empty form
    const ent = s.route.endsWith("/new") ? null : entityFor(s.route, seed);
    if (s.route.endsWith("/new")) s.pageTitle = s.title;
    if (ent) {
      if (s.kind === "editor") s.pageTitle = ent.name;
      s.values = ent.source;
      for (const f of s.sections.flatMap((x) => x.fields)) {
        const l = f.label.toLowerCase();
        const k = Object.keys(ent.values).find((key) => l === key || l.startsWith(key));
        if (k !== undefined && ent.values[k] !== null && ent.values[k] !== undefined) f.value = String(ent.values[k]);
      }
    }
  }
  return { nav, roleLabel, kpis, sectionLabels, sectionFields, cardFields, screens, brand: { name: seed.store.store_name, tag: copy.adminCopy.brandTag } };
}

/** The seed record an edit screen (or a settings page) opens on: field label (lower-case prefix) -> value. */
function entityFor(route, seed) {
  const r = (paise) => (paise == null ? "" : String(paise / 100));
  const on = (b) => (b ? "on" : "off");
  const st = seed.store, p = seed.products[0], c = seed.categories[0], k = seed.collections[0], cp = seed.coupons[0], post = seed.posts[0];
  const f = seed.faqs[0], pg = seed.pages[0], t = seed.testimonials[0], m = seed.methods[0], z = seed.zones[1], i = seed.integrations[0];
  const o = seed.seoOverrides[0], rd = seed.redirects[0];
  const E = (name, values) => ({ name, values, source: "seed" });
  const base = route.split("/").slice(2, route.includes("/seo/") || route.includes("/shipping/") ? 4 : 3).join("/");
  switch (base) {
    case "products": return E(p.name, { name: p.name, "url slug": p.slug, brand: "wavy", category: p.category.name, status: "published", featured: on(p.badges.includes("Bestseller")),
      badges: p.badges.join(", "), tags: p.tags.join(", "), collections: seed.collections.filter((x) => x.products.includes(p.slug)).map((x) => x.name).join(", "), "short description": p.short, description: p.body.split("\n\n")[1] ?? p.body, highlights: p.highlights.join(" · "),
      option: "Colour", values: p.colours.map((x) => x.v).join(", "), group: p.specs[0]?.group, label: p.specs[0]?.label, value: p.specs[0]?.value,
      "weight (g)": p.weight, "hsn code": p.hsn, "country of origin": "India", returnable: "on", "return window": st.return_window_days, "seo title": `${p.name} | wavy`, "meta description": p.short, "hide from search": "off" });
    case "categories": return E(c.name, { name: c.name, slug: c.slug, description: c.description, active: "on", "show on home": on(c.showOnHome), "seo title": `${c.name} | wavy`, "meta description": c.description, "parent category": "None (top level)" });
    case "collections": return E(k.name, { products: k.products.map((sl) => seed.products.find((x) => x.slug === sl).name).join(", "), name: k.name, slug: k.slug, description: k.description, active: "on", "show on home": on(k.showOnHome), "seo title": `${k.name} | wavy`, "meta description": "The newest clothing, shoes and accessories at wavy." });
    case "coupons": return E(cp.code, { code: cp.code, status: cp.status, description: cp.description, type: cp.type, percent: cp.value, "minimum order": r(cp.min_order_amount), starts: "15 Oct 2026, 00:00", ends: "15 Nov 2026, 23:59" });
    case "blog": return E(post.title, { title: post.title, slug: post.slug, excerpt: post.excerpt, body: `## ${post.sections[0].heading}`, status: "published", author: post.author, category: post.category, tags: "Capsule wardrobe", "seo title": `${post.title} | wavy`, "meta description": post.excerpt });
    case "faqs": return E(f.question, { question: f.question, answer: f.answer, category: f.category, order: f.sort_order, "sort order": f.sort_order, published: "on" });
    case "pages": return E(pg.title, { title: pg.title, slug: pg.slug, type: pg.type, status: pg.status, "seo title": pg.title, blocks: JSON.stringify(pg.blocks[0]).slice(0, 60) + "…" });
    case "testimonials": return E(t.author_name, { author: t.author_name, name: t.author_name, role: t.author_role, quote: t.quote, rating: t.rating, published: "on", order: t.sort_order, "sort order": t.sort_order });
    case "shipping/methods": return E(m.name, { name: m.name, code: m.code, description: m.description, "rate (inr)": r(m.rate), "free above": r(m.free_above), "min delivery days": m.min_days, "max delivery days": m.max_days, "sort order": m.sort_order, "cash on delivery": on(m.cod_available) });
    case "shipping/zones": return E(z.name, { name: z.name, states: z.states.replace(/[{}]/g, "").split(",").join(", ") });
    case "integrations": return E(i.provider, { provider: i.provider, environment: i.environment, "secret ref": i.secret_ref, config: i.config });
    case "seo/overrides": return E(o.path, { path: o.path, title: o.title, description: o.description, "meta description": o.description });
    case "seo/redirects": return E(rd.from_path, { from: rd.from_path, to: rd.to_path, "status code": rd.status_code, code: rd.status_code });
    case "settings": return E(st.store_name, { "store name": st.store_name, currency: st.currency, locale: st.locale, timezone: st.timezone, "return window": st.return_window_days, "low-stock": st.low_stock_default, "stock hold": 15, "support email": st.support_email });
    case "staff": return { ...E("Owner", { email: `owner@${st.support_email.split("@")[1]}`, "full name": "Owner", role: "Super admin", status: "active" }), source: "illustrative" };
    case "reviews": return { ...E(`Review by ${t.author_name}`, { title: "Never wrinkled once", body: t.quote, review: t.quote, rating: t.rating, "author name": t.author_name, author: t.author_name, product: seed.products[9].name, status: "approved" }), source: "illustrative" };
    case "offers": return { ...E("Festive bundle", { name: "Festive bundle", status: "scheduled" }), source: "illustrative" };
    case "campaigns": return { ...E("Diwali 2026", { name: "Diwali 2026", slug: "diwali-2026", status: "scheduled" }), source: "illustrative" };
    case "tax": return E("Tax", { "gst rate": st.tax_percentage, gstin: "" });
    case "shipping": return E("Shipping", { "flat shipping fee": r(st.flat_shipping_fee), "free shipping above": r(st.free_shipping_threshold), "cod fee": r(st.cod_fee), "cod max order": r(st.cod_max_order_amount) });
    default: return null;
  }
}

/** Resolves each table's cells from its rows by column heading (the heading names the row field). */
function fillTables(s) {
  const d = s.rows.data;
  const sets = Array.isArray(d) ? [d] : Object.values(d ?? {}).filter(Array.isArray);
  const key = (r, c) => {
    const h = c.toLowerCase(), ks = Object.keys(r);
    return ks.find((k) => k === h) ?? ks.find((k) => h.startsWith(k) || k.startsWith(h)) ?? ks.find((k) => h.split(/[\s/]+/).includes(k));
  };
  const score = (rows, cols) => (rows.length ? cols.filter(Boolean).reduce((n, c) => n + (key(rows[0], c) === c.toLowerCase() ? 2 : key(rows[0], c) ? 1 : 0), 0) : 0);
  const pick = (cols) => sets.map((rows) => [rows, score(rows, cols)]).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  for (const t of s.sections.flatMap((x) => x.tables)) {
    const rows = s.route === "/admin/dashboard" ? d.orders : pick(t.columns);
    t.cells = rows ? rows.map((r) => t.columns.map((c) => (c ? String(r[key(r, c)] ?? "-") : ""))) : [];
    t.sub = rows ? rows.map((r) => r.sub ?? null) : [];
  }
}

// ---------- rows: seed data where seed.sql has it, otherwise clearly-labelled illustrative rows ----------
function rowsFor(s, { seed, rupees, orderNo, customerNames, copy }) {
  const base = s.route.split("/")[2];
  const P = seed.products;
  const st = copy.orderStatusLabels, pay = copy.paymentStatusLabels;
  const seedRows = (data) => ({ source: "seed", data });
  const illus = (data) => ({ source: "illustrative", data });
  const ord = (i) => {
    const p = P[(i * 5 + 3) % P.length], q = P[(i * 7 + 11) % P.length];
    const lines = i % 3 === 0 ? [p, q] : [p];
    const sub = lines.reduce((n, x) => n + x.price, 0);
    // shipping as the seed sets it: free over store_settings.free_shipping_threshold, else the standard method rate
    const ship = sub >= seed.store.free_shipping_threshold ? 0 : seed.methods[0]?.rate ?? seed.store.flat_shipping_fee;
    const name = customerNames[i % customerNames.length];
    return { order: orderNo(24 - i), customer: name, email: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "") + "@example.com", date: `${28 - i * 2} Sep 2026`, placed: `${28 - i * 2} Sep 2026`,
      items: lines.length, slugs: lines.map((x) => x.slug), subtotal: rupees(sub), shipping: ship ? rupees(ship) : copy.cartCopy.free, total: rupees(sub + ship), amount: rupees(sub + ship),
      payment: [pay.captured, pay.captured, "COD", pay.captured, pay.failed][i % 5],
      status: [st.paid, st.packed, st.shipped, st.delivered, st.pending_payment, st.processing][i % 6], provider: i % 5 === 2 ? "cod" : "razorpay · upi", product: p.name };
  };
  switch (base) {
    case "products": return seedRows(P.map((p) => ({ product: p.name, sub: `${p.variants} variants`, category: p.category.name, price: rupees(p.price), stock: `${p.stock} in stock`, status: "Published" })));
    case "inventory": return seedRows({ ledger: P.slice(0, 3).map((p) => ({ when: "Seed import", reason: "initial", "on hand change": `+${25 + ((7 + p.no * 3) % 36)}`, "reserved change": "0", "on hand after": String(25 + ((7 + p.no * 3) % 36)), by: "import", note: "seed" })), stock: P.slice(0, 12).map((p) => ({ "product / variant": `${p.name} · ${p.colours[0].v}${p.sizes ? " / " + p.sizes[0] : ""}`, sku: `${p.sku}-${p.colours[0].v.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-${p.sizes ? p.sizes[0].replace(/\W/g, "") : "OS"}`,
      "on hand": String(25 + ((7 + p.no * 3) % 36)), reserved: "0", available: String(25 + ((7 + p.no * 3) % 36)), stock: "In stock" })) });
    case "categories": return seedRows(seed.categories.filter((c) => !c.parent).flatMap((r) => [r, ...r.children.map((c) => ({ ...c, child: true }))]).map((c) => ({
      name: c.name, meta: `/${c.slug} · ${P.filter((p) => p.category.id === c.id || p.category.parent === c.id).length} products`, child: !!c.child, home: !c.child })));
    case "collections": return seedRows(seed.collections.map((c) => ({ image: "", collection: c.name, sub: `/${c.slug}`, products: String(c.products.length), home: c.showOnHome ? "On home" : "-", schedule: "Always", status: "Active" })));
    case "coupons": return seedRows(seed.coupons.map((c) => ({ code: c.code, description: c.description, type: c.type, discount: `${c.value}%`, value: `${c.value}%`, "min order": rupees(c.min_order_amount), valid: "15 Oct – 15 Nov 2026", targets: "All products", status: "Active", used: "0" })));
    case "testimonials": return seedRows(seed.testimonials.map((t) => ({ author: t.author_name, name: t.author_name, role: t.author_role, quote: t.quote, rating: "★".repeat(t.rating), status: "Published", order: String(t.sort_order) })));
    case "blog": return seedRows(seed.posts.map((p) => ({ title: p.title, post: p.title, category: p.category, author: p.author, status: "Published", published: "Sep 2026", reading: `${p.minutes} min` })));
    case "faqs": return seedRows(seed.faqs.map((f) => ({ question: f.question, category: f.category, order: String(f.sort_order), status: "Published" })));
    case "pages": return seedRows(seed.pages.map((p) => ({ title: p.title, page: p.title, slug: `/${p.slug}`, path: `/${p.slug}`, type: p.type, status: "Published" })));
    case "seo": return seedRows({ overrides: seed.seoOverrides.map((o) => ({ path: o.path, title: o.title, indexing: "Indexed" })), redirects: seed.redirects.map((r) => ({ from: r.from_path, to: r.to_path, code: String(r.status_code), hits: "0", status: "Active" })) });
    case "shipping": return seedRows({ zones: seed.zones.map((z) => ({ name: z.name, meta: z.is_default ? "Default zone" : `${(z.states.match(/,/g) ?? []).length + 1} states` })),
      methods: seed.methods.map((m) => ({ zone: m.zone, method: m.name, name: m.name, code: m.code, rate: rupees(m.rate), "free above": m.free_above ? rupees(m.free_above) : "-", days: `${m.min_days}-${m.max_days} days`, cod: m.cod_available ? "Yes" : "No" })) });
    case "integrations": return seedRows(seed.integrations.map((i) => ({ integration: i.provider, provider: i.provider, enabled: i.secret_ref ? "Yes" : "No", "last checked": "Never", environment: i.environment, secret: i.secret_ref ?? "-", "secret ref": i.secret_ref ?? "-", status: i.secret_ref ? "Configured" : "Not set", updated: "-" })));
    case "payments": return seedRows({ gateways: seed.gateways.map((g) => ({ name: g.display_name, provider: g.provider, mode: g.mode, on: g.is_enabled })),
      payments: [0, 1, 2, 3, 4].map((i) => { const o = ord(i); return { order: o.order, provider: o.provider, status: o.payment, amount: o.total, refunded: "₹0", "last failure": i === 4 ? "bank_declined" : "-", "provider ids": `order_P${7 + i}x…`, created: o.date }; }) });
    case "orders": return illus([0, 1, 2, 3, 4, 5, 6].map(ord));
    case "customers": return illus(customerNames.map((name, i) => ({ customer: name, contact: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "") + "@example.com", status: "Active", orders: String(1 + (i % 3)),
      "lifetime value": rupees(P[(i * 3) % P.length].price * (1 + (i % 3))), "last order": `${26 - i * 3} Sep 2026`, joined: `${3 + i} Mar 2026` })));
    case "returns": return illus([0, 1].map((i) => ({ ...ord(i + 2), reason: Object.values(copy.returnReasonLabels)[i], status: ["Requested", "Approved"][i] })));
    case "reviews": return illus(seed.testimonials.slice(0, 5).map((t, i) => ({ review: t.quote, product: P[[9, 0, 17, 8, 13][i]].name, author: t.author_name, rating: "★".repeat(t.rating), status: ["Pending", "Approved", "Approved", "Pending", "Approved"][i], date: `${20 + i} Sep 2026` })));
    case "staff": return illus([{ name: "Owner", email: `owner@${seed.store.support_email.split("@")[1]}`, role: "Super admin", status: "Active" }, { name: "Catalog lead", email: `catalog@${seed.store.support_email.split("@")[1]}`, role: "Catalog manager", status: "Active" }]);
    case "offers": return illus([{ name: "Festive bundle", type: "Bundle", target: "The Festive Edit", status: "Scheduled", window: "15 Oct – 15 Nov" }]);
    case "campaigns": return illus([{ name: "Diwali 2026", status: "Scheduled", window: "15 Oct – 15 Nov", coupons: "FESTIVE15", products: "6" }]);
    case "audit-log": return illus([0, 1, 2, 3].map((i) => ({ when: `${28 - i} Sep 2026, 1${i}:20`, actor: "Owner", action: ["product.update", "home_section.update", "coupon.create", "settings.update"][i], entity: [P[0].name, "Hero carousel", "FESTIVE15", "Store"][i], target: [P[0].name, "Hero carousel", "FESTIVE15", "Store"][i] })));
    case "dashboard": return illus({ orders: [0, 1, 2, 3, 4].map(ord), low: P.slice(0, 4).map((p) => ({ name: p.name, sku: `${p.sku}-${p.colours[0].v.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-${p.sizes ? p.sizes[0].replace(/\W/g, "") : "OS"}`, left: String(3 + (p.no % 3)) })) });
    case "analytics": return illus({});
    default: return { source: "none", data: [] };
  }
}
