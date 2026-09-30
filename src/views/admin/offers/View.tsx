"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/admin/Panel";
import type { Offer } from "@/data/admin/types";
import type { Collection } from "@/types/domain";
import { mutate } from "../api";
import { describeOffer } from "./components/describe";
import { OfferBuilder } from "./components/OfferBuilder";

export function OffersView({ offers, collections }: { offers: Offer[]; collections: Collection[] }) {
  const [items, setItems] = useState(offers);
  const [building, setBuilding] = useState(false);

  const toggle = (o: Offer) => {
    const before = items;
    const status = o.status === "active" ? "paused" : "active";
    setItems(items.map((x) => (x.id === o.id ? { ...x, status } : x)));
    void mutate(`offers/${o.id}/status`, { status }, { success: `${o.name} ${status}`, rollback: () => setItems(before) });
  };
  const create = (o: Offer) => {
    const before = items;
    setItems([o, ...items]);
    setBuilding(false);
    // TODO(backend agent): call /api/admin/offers — pricing service applies offers server-side (never trust client totals)
    void mutate("offers", o, { success: `Offer “${o.name}” created`, rollback: () => setItems(before) });
  };

  return (
    <>
      <PageHeader title="Offers" description="Automatic cart deals: bundles, BOGO and spend tiers. Applied by the server at checkout."
        actions={!building && <Button size="sm" onClick={() => setBuilding(true)}>New offer</Button>} />
      {building && <div className="mb-6"><OfferBuilder collections={collections} onCancel={() => setBuilding(false)} onSave={create} /></div>}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((o) => (
          <li key={o.id}>
            <Panel title={o.name} actions={<StatusBadge status={o.status} />} className="h-full">
              <p className="t-overline text-ink-soft">{o.kind === "bundle" ? "Bundle" : o.kind === "bogo" ? "Buy X get Y" : "Tiered discount"}</p>
              <p className="mt-1 text-body">{describeOffer(o, collections)}</p>
              <Button size="sm" variant="secondary" className="mt-4" onClick={() => toggle(o)}>{o.status === "active" ? "Pause" : "Activate"}</Button>
            </Panel>
          </li>
        ))}
      </ul>
    </>
  );
}
