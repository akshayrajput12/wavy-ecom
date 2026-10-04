import "server-only";
import ExcelJS from "exceljs";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import { type Column, EXAMPLE_PREFIX, headerOf, type ImportIssue, MAX_ROWS, SHEET_KEYS, SHEETS } from "./columns";
import { type At, CategoryRow, CollectionRow, ProductRow, VariantRow } from "./schema";

const ROW_SCHEMAS = { categories: CategoryRow, collections: CollectionRow, products: ProductRow, variants: VariantRow } as const;
export interface ParsedBook {
  categories: At<CategoryRow>[]; collections: At<CollectionRow>[]; products: At<ProductRow>[]; variants: At<VariantRow>[];
  issues: ImportIssue[];
}

const norm = (h: string) => h.replace(/\*/g, "").trim().toLowerCase();
/** Sheets are scanned up to this row; anything past it is a runaway sheet, not data. */
const SCAN_LIMIT = 20_000;

/** Plain text of any cell (rich text, formula results and hyperlinks included). */
const cellText = (c: ExcelJS.Cell) => (c.value == null ? "" : c.text ?? "").trim();

/** .xlsx buffer -> typed rows per sheet + row-level issues (sheet, row, column, message). */
export async function readBook(buf: ArrayBuffer): Promise<ParsedBook> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf);
  } catch {
    throw new ApiError(422, "invalid_file", "This is not a readable .xlsx file. Save it as Excel Workbook (.xlsx) and try again.");
  }
  const out: ParsedBook = { categories: [], collections: [], products: [], variants: [], issues: [] };
  let total = 0;
  for (const key of SHEET_KEYS) {
    const spec = SHEETS[key];
    const ws = wb.getWorksheet(spec.name);
    if (!ws) continue;   // every sheet is optional
    if (ws.rowCount > SCAN_LIMIT) throw new ApiError(413, "too_many_rows", `${spec.name} has more than ${SCAN_LIMIT} rows`);
    const cols = new Map<number, Column>();
    ws.getRow(1).eachCell((cell, n) => {
      const col = (spec.columns as readonly Column[]).find((c) => norm(c.header) === norm(cellText(cell)));
      if (col) cols.set(n, col);
    });
    const missing = (spec.columns as readonly Column[]).filter((c) => c.required && ![...cols.values()].includes(c));
    for (const c of missing) out.issues.push({ sheet: spec.name, row: 1, column: c.header, message: "Column is missing: download a fresh template" });
    if (missing.length) continue;
    const schema: z.ZodType = ROW_SCHEMAS[key];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const values: Record<string, string> = {};
      for (const [n, col] of cols) values[col.key] = cellText(row.getCell(n));
      const first = values[spec.columns[0].key] ?? "";
      if (Object.values(values).every((v) => !v) || first.toUpperCase().startsWith(EXAMPLE_PREFIX)) continue;
      if (++total > MAX_ROWS) throw new ApiError(413, "too_many_rows", `Up to ${MAX_ROWS} rows per import (example rows not counted). Split the file.`);
      let res = schema.safeParse(values);
      if (!res.success) {
        for (const i of res.error.issues) out.issues.push({ sheet: spec.name, row: r, column: headerOf(key, String(i.path[0] ?? "")), message: i.message });
        // keep checking the rest of the row (category, SKU clashes...) with the bad cells blanked; the file is already rejected
        res = schema.safeParse({ ...values, ...Object.fromEntries(res.error.issues.map((i) => [String(i.path[0]), ""])) });
      }
      if (res.success) (out[key] as unknown[]).push({ ...(res.data as object), row: r });
    }
  }
  if (!total && !out.issues.length) throw new ApiError(422, "empty_file", "No rows to import: fill the Categories, Collections, Products or Variants sheet.");
  return out;
}
