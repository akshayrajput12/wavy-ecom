/**
 * Server-side PDF for invoices: the same InvoiceDocument as the screen, rendered through a react-pdf kit.
 * A4, fonts embedded from ./fonts (Urbanist, Plus Jakarta Sans, Geist Mono; SIL OFL). One invoice starts a page.
 */
import path from "node:path";
import { Document, Font, Image, Page, renderToBuffer, StyleSheet, Text, View, type Styles } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import type { BoxRole, InvoiceKit, TextRole } from "@/components/invoice/kit";
import type { Invoice } from "@/types/domain";

// ponytail: react-pdf can't read CSS variables, so these mirror the :root tokens in src/app/globals.css. Keep in sync.
type Style = Styles[string];

const INK = "#121211";        // --ink
const INK_SOFT = "#5b5954";   // --ink-soft
const INK_MUTED = "#8a8780";  // --ink-muted
const SURFACE = "#fbfaf7";    // --surface (the paper)
const LINE = "#dedad2";       // --line
const LINE_SOFT = "#e7e4dd";  // --line-soft
const ACCENT = "#dcd6ca";     // --accent (stone total block)

let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const f = (file: string) => path.join(process.cwd(), "src", "backend", "invoices", "fonts", file);
  Font.register({ family: "Jakarta", fonts: [
    { src: f("PlusJakartaSans-Regular.ttf"), fontWeight: 400 }, { src: f("PlusJakartaSans-Medium.ttf"), fontWeight: 500 },
    { src: f("PlusJakartaSans-SemiBold.ttf"), fontWeight: 600 },
  ] });
  Font.register({ family: "Urbanist", fonts: [{ src: f("Urbanist-SemiBold.ttf"), fontWeight: 600 }, { src: f("Urbanist-Bold.ttf"), fontWeight: 700 }] });
  Font.register({ family: "GeistMono", fonts: [{ src: f("GeistMono-Regular.ttf"), fontWeight: 400 }, { src: f("GeistMono-Medium.ttf"), fontWeight: 500 }] });
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

// Sizes are the DomKit sizes x ~0.71 (840px sheet -> 595pt A4).
const box = StyleSheet.create<Record<BoxRole, Style>>({
  page: { backgroundColor: SURFACE, color: INK, fontFamily: "Jakarta", paddingHorizontal: 34, paddingBottom: 28 },
  band: { marginHorizontal: -34, marginBottom: 26, height: 4, backgroundColor: INK },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 0.75, borderBottomColor: INK, paddingBottom: 17 },
  brand: { maxWidth: "58%", gap: 1.5 },
  titleBlock: { gap: 3 },
  parties: { flexDirection: "row", gap: 17, borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 17 },
  party: { flex: 1, gap: 1.5 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  table: { marginTop: 17 },
  thead: { flexDirection: "row", borderTopWidth: 0.75, borderBottomWidth: 0.75, borderColor: INK, paddingVertical: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE_SOFT, paddingVertical: 7 },
  cell: { paddingHorizontal: 3 },
  summary: { marginTop: 17, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 28 },
  words: { maxWidth: "52%", gap: 3 },
  totals: { width: "40%", gap: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", gap: 11 },
  grand: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", backgroundColor: ACCENT, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 7 },
  foot: { marginTop: 28, flexDirection: "row", justifyContent: "space-between", gap: 17, borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 11 },
});
const caps = { textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, color: INK_SOFT, fontSize: 7 } as const;
const text = StyleSheet.create<Record<TextRole, Style>>({
  wordmark: { fontFamily: "Urbanist", fontWeight: 700, fontSize: 18, letterSpacing: -0.3, marginBottom: 6 },
  overline: { ...caps, marginBottom: 4 },
  title: { fontFamily: "Urbanist", fontWeight: 600, fontSize: 30, letterSpacing: -1, lineHeight: 1 },
  number: { fontFamily: "GeistMono", fontWeight: 500, fontSize: 10.5 },
  strong: { fontSize: 9, fontWeight: 600, lineHeight: 1.45 },
  body: { fontSize: 9, lineHeight: 1.45 },
  muted: { fontSize: 8, color: INK_SOFT, lineHeight: 1.45 },
  th: { ...caps, letterSpacing: 0.2 }, // DomKit: tracking-wide so narrow money columns fit
  td: { fontSize: 9, fontWeight: 500, lineHeight: 1.35 },
  tdNum: { fontFamily: "GeistMono", fontSize: 7.5, lineHeight: 1.5 },
  tdIndex: { fontFamily: "GeistMono", fontSize: 7.5, lineHeight: 1.5, color: INK_MUTED },
  grandLabel: { fontFamily: "Urbanist", fontWeight: 600, fontSize: 11.5 },
  grandValue: { fontFamily: "GeistMono", fontWeight: 500, fontSize: 13.5 },
});

type Img = { data: Buffer; format: "png" | "jpg" };

function pdfKit(logos: Map<string, Img>): InvoiceKit {
  return {
    Box: ({ s, w, right, children }) => {
      const style: Style[] = [box[s], ...(w ? [{ width: `${w}%` }] : []), ...(right ? [{ alignItems: "flex-end" } as Style] : [])];
      return s === "page" ? <Page size="A4" style={style} wrap>{children}</Page> : <View style={style}>{children}</View>;
    },
    Text: ({ s, right, children }) => <Text style={right ? [text[s], { textAlign: "right" }] : text[s]}>{children}</Text>,
    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt; the store name is in the document metadata
    Logo: ({ src }) => <Image src={logos.get(src)!} style={{ height: 28, maxWidth: 170, objectFit: "contain", marginBottom: 6 }} />,
  };
}

/** Logo bytes (PNG/JPEG only: react-pdf can't draw SVG/WebP). Anything else falls back to the wordmark. */
async function loadLogos(urls: string[]): Promise<Map<string, Img>> {
  const out = new Map<string, Img>();
  await Promise.all([...new Set(urls)].map(async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const type = res.headers.get("content-type") ?? "";
      const format = type.includes("png") ? "png" : /jpe?g/.test(type) ? "jpg" : null;
      if (res.ok && format) out.set(url, { data: Buffer.from(await res.arrayBuffer()), format });
    } catch { /* unreachable logo: wordmark instead */ }
  }));
  return out;
}

/** One PDF, one invoice per page (a long invoice continues on the next page). */
export async function renderInvoicesPdf(invoices: Invoice[]): Promise<Buffer> {
  registerFonts();
  const logos = await loadLogos(invoices.flatMap((i) => (i.seller.logoUrl ? [i.seller.logoUrl] : [])));
  const kit = pdfKit(logos);
  const first = invoices[0];
  return renderToBuffer(
    <Document title={invoices.length === 1 ? `${first.seller.storeName} ${first.number}` : `${first?.seller.storeName ?? ""} invoices`}
      author={first?.seller.name} creator={first?.seller.storeName} producer={first?.seller.storeName}>
      {invoices.map((inv) => (
        <InvoiceDocument key={inv.number} kit={kit}
          invoice={inv.seller.logoUrl && !logos.has(inv.seller.logoUrl) ? { ...inv, seller: { ...inv.seller, logoUrl: undefined } } : inv} />
      ))}
    </Document>,
  );
}
