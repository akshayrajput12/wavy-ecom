// Parses the design tokens in src/app/globals.css `:root` (+ next/font families in src/app/layout.tsx) into tokens.json.
// Self-check: `node tokens.mjs` parses the real files and asserts the shape.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const px = (v) => { const m = /^(-?[\d.]+)(rem|px)?$/.exec(v.trim()); return m ? +m[1] * (m[2] === "rem" ? 16 : 1) : null; };

/** Splits on commas that are not inside parentheses. */
const splitTop = (s) => { const out = []; let depth = 0, cur = ""; for (const c of s) { if (c === "(") depth++; if (c === ")") depth--; if (c === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += c; } return [...out, cur.trim()].filter(Boolean); };

function rootVars(css) {
  const start = css.indexOf(":root {");
  let depth = 0, end = start;
  for (let i = css.indexOf("{", start); i < css.length; i++) { if (css[i] === "{") depth++; if (css[i] === "}" && !--depth) { end = i; break; } }
  const body = css.slice(css.indexOf("{", start) + 1, end);
  const vars = new Map();
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/g)) vars.set(m[1], { value: m[2].trim(), note: m[3] ?? "" });
  return vars;
}

/** hex | var(--x) | color-mix(in srgb, <color> N%, transparent) -> { hex, alpha } */
function color(v, vars) {
  v = v.trim();
  if (/^#[\da-f]{6}$/i.test(v)) return { hex: v.toLowerCase(), alpha: 1 };
  if (/^#[\da-f]{3}$/i.test(v)) return { hex: "#" + [...v.slice(1)].map((c) => c + c).join("").toLowerCase(), alpha: 1 };
  const ref = /^var\(--([\w-]+)\)$/.exec(v);
  if (ref) return vars.has(ref[1]) ? color(vars.get(ref[1]).value, vars) : null;
  const mix = /^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*transparent\)$/.exec(v);
  if (mix) { const c = color(mix[1], vars); return c && { hex: c.hex, alpha: +(c.alpha * +mix[2] / 100).toFixed(3) }; }
  return null;
}

function range(v) {
  const n = px(v);
  if (n !== null) return { min: n, max: n };
  const c = /^clamp\(([^,]+),.*,([^,]+)\)$/.exec(v.trim());
  return c && px(c[1]) !== null ? { min: px(c[1]), max: px(c[2]) } : null;
}

const COLOR_GROUPS = [["Ink", /^ink/], ["Paper & surfaces", /^(canvas|surface)/], ["Lines", /^line(?!-dark)/], ["Stone accent", /^accent/],
  ["Status", /^(success|warning|danger|info|rating)$/], ["Dark stage", /^(black|on-dark|line-dark)/], ["Utility", /^(overlay|focus)/]];

export function parseTokens(css, layoutSrc = "") {
  const vars = rootVars(css);
  const families = new Map([...layoutSrc.matchAll(/(\w+)\(\{\s*variable:\s*"(--[\w-]+)"/g)].map((m) => [m[2].slice(2), m[1].replace(/_/g, " ")]));
  const pick = (re) => [...vars].filter(([k]) => re.test(k));

  const colors = [];
  for (const [name, { value, note }] of vars) {
    if (name.startsWith("art-")) continue; // illustration-only palette (TearReveal), never UI
    const c = color(value, vars);
    const group = COLOR_GROUPS.find(([, re]) => re.test(name))?.[0];
    if (c && group) colors.push({ name, group, ...c, note });
  }
  const FONT_ROLES = { ui: "UI & body", editorial: "Display headings", accent: "Accent italic", mono: "Indices & counters" };
  const fonts = pick(/^font-(ui|editorial|accent|mono)$/).map(([k, { value }]) => {
    const role = k.slice(5);
    const first = splitTop(value)[0];
    const ref = /^var\(--([\w-]+)\)$/.exec(first);
    return { token: k, role: FONT_ROLES[role], family: (ref && families.get(ref[1])) || first.replace(/["']/g, ""), stack: value };
  });
  const typeScale = pick(/^text-/).map(([k, { value, note }]) => ({ name: k.slice(5), ...range(value), note }));
  const weights = Object.fromEntries(pick(/^weight-/).map(([k, { value }]) => [k.slice(7), +value]));
  const leading = Object.fromEntries(pick(/^leading-/).map(([k, { value }]) => [k.slice(8), +value]));
  const tracking = Object.fromEntries(pick(/^tracking-/).map(([k, { value }]) => [k.slice(9), parseFloat(value)])); // em
  const stretch = Object.fromEntries(pick(/^stretch-/).map(([k, { value }]) => [k.slice(8), parseFloat(value)])); // %
  const radii = pick(/^radius-/).map(([k, { value }]) => ({ name: k.slice(7), value: px(value) }));
  const spacing = pick(/^(space-|section-y$|head-gap$|gutter$)/).map(([k, { value, note }]) => ({ name: k, ...range(value), note }));
  const shadows = pick(/^shadow-/).map(([k, { value }]) => ({
    name: k.slice(7),
    layers: splitTop(value).map((layer) => {
      const parts = layer.split(/\s+(?![^(]*\))/); // whitespace outside parentheses
      const lengths = parts.filter((p) => px(p) !== null).map(px);
      const [x, y, blur, spread = 0] = lengths;
      return { x, y, blur, spread, ...color(parts.filter((p) => px(p) === null).join(" "), vars) };
    }),
  }));
  // semantic type classes (.t-hero, .t-h1 ...): single-selector rules, values resolved through :root
  const varOf = (v) => { const r = /^var\(--([\w-]+)\)$/.exec(v?.trim() ?? ""); return r ? vars.get(r[1])?.value : v; };
  const typeStyles = [...css.matchAll(/^\s*\.t-([\w-]+)\s*\{([^}]*)\}/gm)].map(([, name, body]) => {
    const d = Object.fromEntries([...body.matchAll(/([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
    const fam = /^var\(--(font-[\w-]+)\)$/.exec(d["font-family"] ?? "")?.[1] ?? "font-ui";
    return {
      name, family: fonts.find((f) => f.token === fam)?.family, fontToken: fam,
      size: d["font-size"] ? range(varOf(d["font-size"])) : null,
      lineHeight: d["line-height"] ? parseFloat(varOf(d["line-height"])) : null, // multiplier
      tracking: d["letter-spacing"] ? parseFloat(varOf(d["letter-spacing"])) : 0, // em
      weight: d["font-weight"] ? +varOf(d["font-weight"]) : 400,
      upper: d["text-transform"] === "uppercase",
    };
  });
  // `.on-dark` stage: the colour tokens it re-points (ink -> on-dark, canvas -> black, …), resolved through :root
  const dark = /\.on-dark\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
  const onDark = [...dark.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, v]) => ({ name, ...color(v, vars) })).filter((c) => c.hex);
  return { source: "src/app/globals.css :root", colors, onDark, fonts, typeScale, typeStyles, weights, leading, tracking, stretch, radii, spacing, shadows, container: px(vars.get("container")?.value ?? "") };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const t = parseTokens(readFileSync(join(root, "src/app/globals.css"), "utf8"), readFileSync(join(root, "src/app/layout.tsx"), "utf8"));
  const assert = (ok, msg) => { if (!ok) { console.error("✗", msg); process.exit(1); } };
  assert(t.colors.find((c) => c.name === "ink")?.hex === "#121211", "ink colour");
  assert(t.colors.find((c) => c.name === "line-dark")?.alpha === 0.14, "color-mix alpha");
  assert(!t.colors.some((c) => c.name.startsWith("art-")), "art tokens excluded");
  assert(t.fonts.find((f) => f.role === "Display headings")?.family === "Bricolage Grotesque", "display family");
  assert(t.typeScale.find((s) => s.name === "hero")?.max === 88, "hero clamp max");
  assert(t.weights.display === 360 && t.weights.heading === 400, "weights");
  assert(t.shadows.find((s) => s.name === "md")?.layers[0].y === 12 && t.shadows[0].layers.length === 2, "shadow layers");
  assert(t.typeStyles.find((s) => s.name === "hero")?.lineHeight === 0.95 && t.typeStyles.find((s) => s.name === "hero")?.weight === 360, "t-hero");
  assert(t.typeStyles.find((s) => s.name === "overline")?.upper && t.typeStyles.find((s) => s.name === "index")?.family === "Geist Mono", "t-overline / t-index");
  assert(t.radii.find((r) => r.name === "pill")?.value === 999, "radii");
  assert(t.onDark.find((c) => c.name === "ink")?.hex === "#f6f4ef" && t.onDark.find((c) => c.name === "surface-2")?.alpha === 0.08, ".on-dark map");
  console.log(`✓ tokens: ${t.colors.length} colours, ${t.fonts.length} fonts, ${t.typeScale.length} sizes, ${t.radii.length} radii, ${t.spacing.length} spacing, ${t.shadows.length} shadows`);
}
