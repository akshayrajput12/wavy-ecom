"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import type { ProductForm } from "./schema";

const cell = "h-9 w-full rounded-sm border border-line bg-surface px-2 text-body focus:border-ink focus:outline-none aria-invalid:border-danger";
const cols = [["sku", "SKU"], ["color", "Colour"], ["size", "Size"], ["price", "Price (₹)"], ["compareAt", "Compare at (₹)"], ["stock", "Stock"]] as const;

export function VariantsTable({ control, register, errors, disabled }: {
  control: Control<ProductForm>; register: UseFormRegister<ProductForm>; errors: FieldErrors<ProductForm>; disabled?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  return (
    <div className="sm:col-span-2">
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-[720px] text-body">
          <caption className="sr-only">Variants</caption>
          <thead className="bg-canvas text-left text-meta text-ink-soft">
            <tr>{cols.map(([, h]) => <th key={h} scope="col" className="px-3 py-2 font-medium">{h}</th>)}<th scope="col"><span className="sr-only">Remove</span></th></tr>
          </thead>
          <tbody>
            {fields.map((f, i) => (
              <tr key={f.id} className="border-t border-line-soft">
                {cols.map(([k, h]) => {
                  const numeric = k === "price" || k === "compareAt" || k === "stock";
                  return (
                    <td key={k} className="px-3 py-2">
                      <input
                        aria-label={`${h}, variant ${i + 1}`} disabled={disabled} className={cell}
                        type={numeric ? "number" : "text"} min={numeric ? 0 : undefined} step={k === "stock" ? 1 : "any"}
                        aria-invalid={!!errors.variants?.[i]?.[k]}
                        {...register(`variants.${i}.${k}`, numeric ? { setValueAs: (v: string) => (v === "" ? (k === "compareAt" ? undefined : 0) : Number(v)) } : {})}
                      />
                    </td>
                  );
                })}
                <td className="px-2"><button type="button" disabled={disabled || fields.length === 1} onClick={() => remove(i)} aria-label={`Remove variant ${i + 1}`} className="rounded-sm p-2 hover:bg-surface-warm disabled:opacity-30"><Trash2 className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.variants && <p className="mt-2 text-meta text-danger">⚠ Check the highlighted variant fields.</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="secondary" disabled={disabled}
          onClick={() => append({ id: `new-${fields.length}`, sku: "", color: "", size: "", price: 0, stock: 0 })}>Add variant</Button>
        <Link href="/admin/inventory" className="text-meta underline underline-offset-4">Adjust stock with a reason in Inventory</Link>
      </div>
    </div>
  );
}
