"use client";

import { useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { RotateCcw, Scissors, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriceTag } from "@/components/commerce/PriceTag";
import { RatingStars } from "@/components/commerce/RatingStars";
import { WishlistButton } from "@/components/commerce/WishlistButton";
import { TryOnLauncher } from "@/tryon";
import { toCartLine, useCart } from "@/stores/cart";
import { productCopy as c } from "@/data/content";
import type { Product } from "@/types/domain";
import { SizeFinder } from "./SizeFinder";
import { DeliveryCheck } from "./DeliveryCheck";

const TRUST_ICONS = [Truck, RotateCcw, Scissors];
const isFootwear = (p: Product) => p.variants.some((v) => v.size.startsWith("UK"));

/** Screens 08/23/24 — colour, size (with unavailable states), size finder, try-on, add to bag. */
export function PurchasePanel({ product: p }: { product: Product }) {
  const colors = useMemo(() => [...new Map(p.variants.map((v) => [v.color, v])).values()], [p]);
  const firstInStock = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
  const [color, setColor] = useState(firstInStock.color);
  const [size, setSize] = useState<string>();
  const [sizeError, setSizeError] = useState(false);
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);

  const forColor = p.variants.filter((v) => v.color === color);
  const variant = forColor.find((v) => v.size === size);
  const colorSoldOut = forColor.every((v) => v.stock === 0);
  const display = variant ?? forColor[0];

  function addToBag() {
    if (!variant) {
      setSizeError(true);
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    add(toCartLine(p, variant));
    setOpen(true);
    toast.success(`${c.added}: ${p.name} · ${variant.color} · ${variant.size}`);
  }

  return (
    <div className="space-y-7">
      <div>
        {p.badges[0] && <p className="t-overline text-accent-deep">{p.badges[0]}</p>}
        <h1 className="t-display mt-2">{p.name}</h1>
        <p className="mt-1 text-body-lg text-ink-soft">{p.descriptor}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <PriceTag price={display.price} compareAt={display.compareAt} size="lg" />
          <a href="#reviews" className="hover:underline"><RatingStars rating={p.rating} count={p.reviewCount} size="md" /></a>
        </div>
        <p className="mt-1 text-micro text-ink-soft">{c.inclusive}</p>
      </div>

      <fieldset>
        <legend className="text-meta"><span className="font-semibold">{c.color}:</span> {color}{colorSoldOut && ` — ${c.soldOut}`}</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {colors.map((v) => {
            const out = p.variants.filter((x) => x.color === v.color).every((x) => x.stock === 0);
            return (
              <label key={v.color} title={v.color} className={clsx("relative grid size-11 cursor-pointer place-items-center rounded-full border-2 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2", color === v.color ? "border-ink" : "border-transparent hover:border-line")}>
                <input type="radio" name="color" value={v.color} checked={color === v.color} onChange={() => { setColor(v.color); setSize(undefined); }} className="sr-only" />
                <span className="sr-only">{v.color}{out ? ` (${c.soldOut})` : ""}</span>
                <span className={clsx("size-8 rounded-full border border-ink/15", out && "opacity-40")} style={{ backgroundColor: v.colorHex }} aria-hidden />
                {out && <span className="absolute h-px w-9 rotate-45 bg-ink" aria-hidden />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset ref={sizesRef} aria-describedby={sizeError ? "size-error" : undefined}>
        <div className="flex items-center justify-between">
          <legend className="text-meta"><span className="font-semibold">{c.size}:</span> {size ?? c.selectSize}</legend>
          {isFootwear(p) ? <span className="text-micro text-ink-soft">{c.footwearNote}</span> : (
            <SizeFinder productFit={p.fit} isSoldOut={(s) => !forColor.some((v) => v.size === s && v.stock > 0)} onUse={(s) => { setSize(s); setSizeError(false); }} />
          )}
        </div>
        <div className={clsx("mt-3 grid gap-2", isFootwear(p) ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-5")}>
          {forColor.map((v) => {
            const out = v.stock === 0;
            return (
              <label key={v.id} className={clsx(
                "relative flex h-12 items-center justify-center overflow-hidden rounded-sm border text-body font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
                out ? "cursor-not-allowed border-line-soft bg-transparent text-ink-muted" : "cursor-pointer",
                !out && (size === v.size ? "border-ink bg-ink text-on-dark" : "border-line bg-surface hover:border-ink"),
              )}>
                <input type="radio" name="size" value={v.size} disabled={out} checked={size === v.size} onChange={() => { setSize(v.size); setSizeError(false); }} className="sr-only" />
                {v.size}
                {out && (<><span className="sr-only"> — {c.soldOut}</span><span className="absolute h-px w-[140%] -rotate-[20deg] bg-line" aria-hidden /></>)}
              </label>
            );
          })}
        </div>
        {sizeError && <p id="size-error" role="alert" className="mt-2 text-meta text-danger">⚠ {c.selectSize}</p>}
        {variant && variant.stock > 0 && variant.stock <= 3 && <p className="mt-2 text-meta font-medium text-warning">{c.fewLeft(variant.stock)}</p>}
      </fieldset>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={addToBag} disabled={colorSoldOut}>
            {colorSoldOut ? c.notify : c.addToBag}
          </Button>
          <WishlistButton productId={p.id} name={p.name} variant="outline" className="size-13" />
        </div>
        {p.tryOnEnabled && <div className="[&>button]:w-full"><TryOnLauncher product={p} garmentColor={display.colorHex} /></div>}
      </div>

      <DeliveryCheck />

      <ul className="grid grid-cols-3 gap-3 border-y border-line py-5">
        {c.trust.map((t, i) => {
          const Icon = TRUST_ICONS[i];
          return (
            <li key={t.title} className="text-center">
              <Icon className="mx-auto size-5" strokeWidth={1.5} aria-hidden />
              <p className="mt-2 text-meta font-semibold">{t.title}</p>
              <p className="text-micro text-ink-soft">{t.body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
