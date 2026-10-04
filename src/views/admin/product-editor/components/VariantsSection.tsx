"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { FormSection } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { axes, generateVariants, variantsStale, type EditorForm, type OptionRow, type SetForm, type VariantForm } from "./form";

const cell = "h-10 w-full min-w-20 rounded-sm border border-line bg-surface px-2 text-meta focus:border-ink focus:outline-none disabled:bg-surface-warm";

function OptionRows({ f, set }: { f: EditorForm; set: SetForm }) {
  const upd = (i: number, p: Partial<OptionRow>) => set({ optionRows: f.optionRows.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (
    <div className="grid gap-3 sm:col-span-2">
      {f.optionRows.map((r, i) => (
        <div key={i} className="grid items-end gap-3 sm:grid-cols-[180px_1fr_auto]">
          <Input label={`Option ${i + 1} name`} value={r.name} placeholder="Size" onChange={(e) => upd(i, { name: e.target.value })} />
          <Input label="Values" value={r.values} placeholder="S, M, L" hint="Comma separated" onChange={(e) => upd(i, { values: e.target.value })} />
          <button type="button" aria-label={`Remove option ${i + 1}`} onClick={() => set({ optionRows: f.optionRows.filter((_, j) => j !== i) })}
            className="mb-6 grid size-11 place-items-center rounded-sm hover:bg-surface-warm"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {f.optionRows.length < 3 && <Button type="button" size="sm" variant="secondary" onClick={() => set({ optionRows: [...f.optionRows, { name: "", values: "" }] })}>Add option</Button>}
        <Button type="button" size="sm" onClick={() => set({ variants: generateVariants(f) })}>Generate variants</Button>
        {variantsStale(f) && <p role="status" className="text-meta text-warning">Options changed: generate variants to update the table below.</p>}
      </div>
    </div>
  );
}

function Bulk({ f, set }: { f: EditorForm; set: SetForm }) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const apply = () => set({ variants: f.variants.map((v) => ({ ...v, ...(price ? { price } : {}), ...(stock && !v.id ? { stock } : {}) })) });
  return (
    <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
      <Input label="Set all prices (Rs)" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />
      <Input label="Set opening stock (new variants)" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-56" />
      <Button type="button" size="sm" variant="secondary" className="mb-0.5" onClick={apply} disabled={!price && !stock}>Apply to all</Button>
    </div>
  );
}

export function VariantsSection({ f, set }: { f: EditorForm; set: SetForm }) {
  const { names } = axes(f.optionRows);
  const upd = (i: number, p: Partial<VariantForm>) => set({ variants: f.variants.map((v, j) => (j === i ? { ...v, ...p } : v)) });
  const num = (i: number, k: "price" | "compareAt" | "cost" | "weight" | "stock" | "threshold", label: string, step = "1", off = false) => (
    <input type="number" min="0" step={step} aria-label={`${label}, variant ${i + 1}`} disabled={off} className={cell} value={f.variants[i][k]} onChange={(e) => upd(i, { [k]: e.target.value })} />
  );
  const txt = (i: number, k: "sku" | "barcode" | "colorHex", label: string, ph = "") => (
    <input aria-label={`${label}, variant ${i + 1}`} placeholder={ph} className={cell} value={f.variants[i][k]} onChange={(e) => upd(i, { [k]: e.target.value })} />
  );
  const heads = [...names, "SKU", "Barcode", "Price (Rs)", "Compare-at", "Cost", "Weight (g)", "Stock", "Low at", "Swatch hex", "Image", "Off"];
  return (
    <FormSection title="Options & variants" description="Up to 3 options. Prices in rupees. Stock of saved variants changes in Inventory.">
      <OptionRows f={f} set={set} />
      <Bulk f={f} set={set} />
      <div className="relative overflow-x-auto overscroll-x-contain sm:col-span-2">
        <table className="w-full min-w-[60rem] border-collapse text-left">
          <caption className="sr-only">Variants</caption>
          <thead><tr>{heads.map((h, k) => <th key={k} scope="col" className="px-1 pb-2 text-micro font-medium text-ink-soft">{h}</th>)}</tr></thead>
          <tbody>
            {f.variants.map((v, i) => (
              <tr key={v.id ?? i} className="border-t border-line-soft">
                {names.map((n, k) => <th key={n} scope="row" className="px-1 py-1.5 text-meta font-medium">{v.options[k] ?? "-"}</th>)}
                <td className="p-1">{txt(i, "sku", "SKU", "auto")}</td>
                <td className="p-1">{txt(i, "barcode", "Barcode")}</td>
                <td className="p-1">{num(i, "price", "Price", "0.01")}</td>
                <td className="p-1">{num(i, "compareAt", "Compare-at price", "0.01")}</td>
                <td className="p-1">{num(i, "cost", "Cost", "0.01")}</td>
                <td className="p-1">{num(i, "weight", "Weight")}</td>
                <td className="p-1">{num(i, "stock", "Stock", "1", Boolean(v.id))}</td>
                <td className="p-1">{num(i, "threshold", "Low-stock threshold")}</td>
                <td className="p-1">{txt(i, "colorHex", "Colour hex", "#RRGGBB")}</td>
                <td className="p-1">
                  <select aria-label={`Image, variant ${i + 1}`} className={cell} value={v.imageId ?? ""} onChange={(e) => upd(i, { imageId: e.target.value || null })}>
                    <option value="">None</option>
                    {f.media.map((m, k) => <option key={m.id} value={m.id}>Image {k + 1}</option>)}
                  </select>
                </td>
                <td className="p-1 text-center"><input type="checkbox" aria-label={`Disable variant ${i + 1}`} checked={v.disabled} onChange={(e) => upd(i, { disabled: e.target.checked })} className="size-5 accent-ink" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FormSection>
  );
}
