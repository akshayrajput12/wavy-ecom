"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminProduct } from "@/types/admin";
import { adminApi, mutate } from "../../api";

/** Per-product displayed rating / review count override (PATCH products/:slug/rating). Blank = use the real numbers. */
export function RatingOverride({ slug }: { slug: string }) {
  const [p, setP] = useState<AdminProduct | null>(null);
  const [rating, setRating] = useState("");
  const [count, setCount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    void adminApi<AdminProduct>("GET", `products/${slug}`).then((res) => {
      if (!live || !res.ok) return;
      setP(res.data); setRating(String(res.data.ratingOverride ?? "")); setCount(String(res.data.reviewCountOverride ?? ""));
    });
    return () => { live = false; };
  }, [slug]);

  if (!p) return <Panel title="Rating override"><p className="t-meta">Loading product...</p></Panel>;
  const save = async () => {
    setSaving(true);
    await mutate("PATCH", `products/${slug}/rating`, { ratingOverride: rating ? Number(rating) : null, reviewCountOverride: count ? Number(count) : null }, { success: "Rating override saved" });
    setSaving(false);
  };
  return (
    <Panel title="Rating override" description={`Real: ${p.ratingAvg} from ${p.reviewCount} reviews. Overrides change only what shoppers see.`}>
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Displayed rating (0-5)" type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} className="w-48" />
        <Input label="Displayed review count" type="number" min="0" step="1" value={count} onChange={(e) => setCount(e.target.value)} className="w-48" />
        <Button type="button" size="sm" variant="secondary" loading={saving} onClick={() => void save()}>Save override</Button>
      </div>
    </Panel>
  );
}
