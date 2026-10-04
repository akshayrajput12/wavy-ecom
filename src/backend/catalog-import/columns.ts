/**
 * Catalog import: one column spec drives the generated template (headers, notes, dropdowns) and the parser,
 * so the two can't drift. Client-safe (the admin dialog imports the limits and the summary type).
 */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
/** Data rows across all sheets (example rows excluded). */
export const MAX_ROWS = 2000;
/** Rows whose first cell starts with this are skipped by the importer. */
export const EXAMPLE_PREFIX = "EXAMPLE";
export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type ListKind = "yesno" | "status" | "categories" | "products";
export interface Column {
  key: string; header: string; note: string;
  /** Required for new rows (existing rows keep their value when the cell is blank). */
  required?: boolean;
  width?: number; list?: ListKind;
}

const yes = "yes or no.";
const keep = "Blank keeps the current value.";

export const SHEETS = {
  categories: {
    name: "Categories", columns: [
      { key: "name", header: "Name", required: true, width: 26, note: "Shown in the store (max 80 characters)." },
      { key: "slug", header: "Slug", width: 24, note: "URL part, e.g. linen-kurtas. Blank = made from the name. Rows with an existing slug update that category." },
      { key: "parent", header: "Parent category", width: 24, list: "categories", note: `Name or slug of the parent, for a sub-category. Blank = top level for new rows. ${keep}` },
      { key: "description", header: "Description", width: 40, note: "Optional." },
      { key: "showOnHome", header: "Show on home", width: 14, list: "yesno", note: yes },
      { key: "sortOrder", header: "Sort order", width: 12, note: "Whole number. Lower shows first." },
    ],
  },
  collections: {
    name: "Collections", columns: [
      { key: "name", header: "Name", required: true, width: 26, note: "Shown in the store (max 80 characters)." },
      { key: "slug", header: "Slug", width: 24, note: "URL part. Blank = made from the name. Must not match a category slug." },
      { key: "description", header: "Description", width: 40, note: "Optional." },
      { key: "active", header: "Active", width: 10, list: "yesno", note: `${yes} New collections default to yes.` },
      { key: "products", header: "Products (SKUs or slugs)", width: 40, note: "Comma-separated product slugs or variant SKUs to add. Products are only added, never removed." },
    ],
  },
  products: {
    name: "Products", columns: [
      { key: "name", header: "Name", required: true, width: 30, note: "Product name (max 140 characters)." },
      { key: "slug", header: "Slug", width: 26, note: "URL part. Blank = made from the name. Rows with an existing slug update that product." },
      { key: "category", header: "Category", required: true, width: 22, list: "categories", note: "Name or slug of a category (existing or on the Categories sheet)." },
      { key: "collections", header: "Collections", width: 24, note: "Comma-separated collection names or slugs. Only added, never removed." },
      { key: "brand", header: "Brand", width: 16, note: "Optional." },
      { key: "shortDescription", header: "Short description", width: 32, note: "Line under the name (max 300 characters)." },
      { key: "description", header: "Description", width: 40, note: "Full description. Markdown is fine." },
      { key: "material", header: "Material", width: 20, note: "Shown in the specifications, e.g. 100% cotton." },
      { key: "care", header: "Care", width: 20, note: "Shown in the specifications, e.g. Machine wash cold." },
      { key: "options", header: "Options", width: 16, note: "Up to 3 option names, comma-separated, e.g. Size, Colour. Blank = a single-variant product." },
      { key: "status", header: "Status", width: 12, list: "status", note: "draft, published, unpublished or archived. New products default to draft." },
      { key: "tags", header: "Tags", width: 22, note: "Comma-separated search tags." },
      { key: "badges", header: "Badges", width: 16, note: "Comma-separated card ribbons, e.g. New, Bestseller (max 5)." },
      { key: "hsnCode", header: "HSN code", width: 11, note: "4-8 digit GST HSN code." },
      { key: "countryOfOrigin", header: "Country of origin", width: 16, note: "Defaults to India." },
      { key: "weightGrams", header: "Weight (g)", width: 11, note: "Shipping weight in grams, whole number." },
      { key: "returnable", header: "Returnable", width: 11, list: "yesno", note: `${yes} Defaults to yes.` },
      { key: "returnWindowDays", header: "Return window (days)", width: 12, note: "0-90. Blank = store default." },
      { key: "featured", header: "Featured", width: 10, list: "yesno", note: yes },
      { key: "sku", header: "SKU", width: 18, note: "Single-variant products only. Blank = made from the slug." },
      { key: "price", header: "Price (₹)", width: 11, note: "Single-variant products only. In rupees, e.g. 1499 or 1499.50." },
      { key: "compareAt", header: "Compare-at (₹)", width: 13, note: "Single-variant products only. Original price, must be above Price." },
      { key: "cost", header: "Cost (₹)", width: 11, note: "Single-variant products only. Never shown to shoppers." },
      { key: "stock", header: "Stock", width: 9, note: "Single-variant products only. Opening stock, used only when the variant is created." },
      { key: "barcode", header: "Barcode", width: 16, note: "Single-variant products only. EAN/UPC, 6-64 characters." },
    ],
  },
  variants: {
    name: "Variants", columns: [
      { key: "product", header: "Product", required: true, width: 28, list: "products", note: "Slug or name of a product on the Products sheet, or the slug of a product already in the store." },
      { key: "option1", header: "Option 1", width: 12, note: "Value of the product's first option, e.g. M." },
      { key: "option2", header: "Option 2", width: 12, note: "Value of the second option, e.g. Indigo." },
      { key: "option3", header: "Option 3", width: 12, note: "Value of the third option." },
      { key: "sku", header: "SKU", required: true, width: 20, note: "Unique code: 3-64 of A-Z, 0-9 and -. Rows with an existing SKU update that variant." },
      { key: "price", header: "Price (₹)", required: true, width: 11, note: "In rupees, e.g. 1499 or 1499.50." },
      { key: "compareAt", header: "Compare-at (₹)", width: 13, note: "Original price, must be above Price." },
      { key: "cost", header: "Cost (₹)", width: 11, note: "Never shown to shoppers." },
      { key: "stock", header: "Stock", width: 9, note: "Opening stock, used only when the variant is created. Change existing stock in Inventory." },
      { key: "weightGrams", header: "Weight (g)", width: 11, note: "Blank = the product's weight." },
      { key: "barcode", header: "Barcode", width: 16, note: "EAN/UPC, 6-64 characters." },
      { key: "colorHex", header: "Swatch hex", width: 11, note: "Colour swatch, e.g. #1F2A44." },
    ],
  },
} as const satisfies Record<string, { name: string; columns: readonly Column[] }>;

export type SheetKey = keyof typeof SHEETS;
export const SHEET_KEYS = Object.keys(SHEETS) as SheetKey[];

export const headerOf = (sheet: SheetKey, key: string) =>
  (SHEETS[sheet].columns as readonly Column[]).find((c) => c.key === key)?.header ?? "";

/** One problem in the uploaded file. row = spreadsheet row number (1 = header). */
export interface ImportIssue { sheet: string; row: number; column: string; message: string }
export interface ImportCount { new: number; updated: number; unchanged: number }
export interface ImportSummary {
  counts: { categories: ImportCount; collections: ImportCount; products: ImportCount; variants: ImportCount; memberships: number };
  errors: ImportIssue[];
  /** Total errors (the list is capped). */
  errorCount: number;
  warnings: ImportIssue[];
  imported: boolean;
}
