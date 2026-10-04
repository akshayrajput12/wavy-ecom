import "server-only";
import ExcelJS from "exceljs";
import { catalogImportCopy } from "@/data/copy";
import { PRODUCT_STATUS } from "@/types/domain";
import { type Column, type ListKind, MAX_ROWS, SHEET_KEYS, SHEETS, type SheetKey } from "./columns";
import { loadTaxonomy } from "./repo";

const t = catalogImportCopy.template;
const LAST = MAX_ROWS + 1;
const firstColumn = (sheet: SheetKey) => `'${SHEETS[sheet].name}'!$A$2:$A$${LAST}`;
const LISTS: Record<ListKind, string> = {
  yesno: '"yes,no"', status: `"${PRODUCT_STATUS.join(",")}"`, categories: firstColumn("categories"), products: firstColumn("products"),
};
/** Codes Excel would otherwise turn into numbers (leading zeros, long barcodes). */
const TEXT_COLUMNS = new Set(["slug", "sku", "barcode", "hsnCode", "option1", "option2", "option3"]);
// xlsx styling takes ARGB: these are spreadsheet colours, not UI tokens.
const HEADER_FILL = "FFEDE8E1", EXAMPLE_FONT = "FF8A8178";

const kurta = "EXAMPLE Handloom cotton kurta";
const EXAMPLES: Record<SheetKey, Record<string, string | number>[]> = {
  categories: [{ name: "EXAMPLE Kurtas", slug: "example-kurtas", parent: "Women", description: "Handloom and block-printed kurtas", showOnHome: "yes", sortOrder: 10 }],
  collections: [{ name: "EXAMPLE Festive edit", slug: "example-festive-edit", description: "Pieces for weddings and pujas", active: "yes", products: "example-handloom-kurta" }],
  products: [
    {
      name: kurta, slug: "example-handloom-kurta", category: "EXAMPLE Kurtas", collections: "EXAMPLE Festive edit", brand: "wavy",
      shortDescription: "Hand-block printed, relaxed fit", description: "Woven on handlooms in Bagru and printed by hand.", material: "100% cotton",
      care: "Machine wash cold", options: "Size, Colour", status: "draft", tags: "kurta, cotton, festive", badges: "New", hsnCode: "6211",
      countryOfOrigin: "India", weightGrams: 350, returnable: "yes", returnWindowDays: 15, featured: "no",
    },
    {
      name: "EXAMPLE Silver jhumka earrings", category: "Accessories", brand: "wavy", shortDescription: "Oxidised 925 silver",
      material: "925 sterling silver", care: "Wipe with a soft cloth", status: "draft", tags: "earrings, silver", hsnCode: "7113",
      weightGrams: 40, returnable: "no", featured: "no", sku: "EX-JHUMKA-01", price: 2499, compareAt: 2999, cost: 900, stock: 25,
    },
  ],
  variants: [
    { product: kurta, option1: "M", option2: "Indigo", sku: "EX-KURTA-IND-M", price: 1799, compareAt: 2199, cost: 650, stock: 10, colorHex: "#2E3A5F" },
    { product: kurta, option1: "L", option2: "Indigo", sku: "EX-KURTA-IND-L", price: 1799, compareAt: 2199, cost: 650, stock: 8, colorHex: "#2E3A5F" },
    { product: kurta, option1: "M", option2: "Rust", sku: "EX-KURTA-RST-M", price: 1899, cost: 680, stock: 6, colorHex: "#B7472A" },
  ],
};

type WithValidations = { dataValidations: { add(range: string, dv: ExcelJS.DataValidation): void } };

function addSheet(wb: ExcelJS.Workbook, key: SheetKey, rows: Record<string, string | number | null>[]) {
  const columns = SHEETS[key].columns as readonly Column[];
  const ws = wb.addWorksheet(SHEETS[key].name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = columns.map((c) => ({ header: c.required ? `${c.header} *` : c.header, key: c.key, width: c.width ?? 14 }));
  const head = ws.getRow(1);
  head.font = { bold: true };
  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    if (TEXT_COLUMNS.has(c.key)) col.numFmt = "@";
    const cell = head.getCell(i + 1);
    cell.note = c.note;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    // ponytail: range validations are in exceljs (worksheet.dataValidations) but missing from its typings.
    if (c.list) {
      const strict = c.list === "yesno" || c.list === "status";
      (ws as unknown as WithValidations).dataValidations.add(`${col.letter}2:${col.letter}${LAST}`, {
        type: "list", allowBlank: true, formulae: [LISTS[c.list]], showErrorMessage: strict,
        ...(strict ? { errorStyle: "stop", error: c.note } : {}),
      });
    }
  });
  for (const ex of EXAMPLES[key]) ws.addRow(ex).font = { italic: true, color: { argb: EXAMPLE_FONT } };
  for (const r of rows) ws.addRow(r);
}

function addInstructions(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Instructions");
  ws.columns = [{ width: 26 }, { width: 11 }, { width: 110 }];
  const line = (text: string, font?: Partial<ExcelJS.Font>) => { const r = ws.addRow([text]); if (font) r.font = font; };
  line(t.title, { bold: true, size: 14 });
  t.rules.forEach((r) => line(r));
  ws.addRow([]);
  line(t.exampleTitle, { bold: true, size: 12 });
  t.example.forEach((r) => line(r));
  for (const key of SHEET_KEYS) {
    ws.addRow([]);
    line(t.columnsTitle(SHEETS[key].name), { bold: true, size: 12 });
    ws.addRow([t.column, t.required, t.notes]).font = { bold: true };
    for (const c of SHEETS[key].columns as readonly Column[]) ws.addRow([c.header, c.required ? t.yes : "", c.note]);
  }
}

/** The import template as an .xlsx, pre-filled with the current categories and collections. */
export async function buildTemplate(): Promise<ArrayBuffer> {
  const { categories, collections } = await loadTaxonomy();
  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  const yn = (b: boolean) => (b ? "yes" : "no");
  const wb = new ExcelJS.Workbook();
  wb.creator = "wavy admin";
  addInstructions(wb);
  addSheet(wb, "categories", categories.map((c) => ({
    name: c.name, slug: c.slug, parent: c.parent_id ? slugById.get(c.parent_id) ?? null : null, description: c.description,
    showOnHome: yn(c.show_on_home), sortOrder: c.sort_order,
  })));
  addSheet(wb, "collections", collections.map((c) => ({ name: c.name, slug: c.slug, description: c.description, active: yn(c.is_active) })));
  addSheet(wb, "products", []);
  addSheet(wb, "variants", []);
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
