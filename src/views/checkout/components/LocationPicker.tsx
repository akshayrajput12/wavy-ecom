"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LocateFixed, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { AddressFields, Place } from "@/backend/geo/normalise";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { addressCopy } from "@/data/copy";
import { api } from "@/stores/http";
import { AddressCard, type Resolved } from "./AddressCard";
import { zoomFor } from "./geoMath";
import { isProblem, ProblemCard, StatusStrip } from "./TrackerStatus";
import { useGeolocation } from "./useGeolocation";

const m = addressCopy.map;
// MapLibre (~300 KB gz) loads only when the panel first opens, so checkout's first load stays light.
const MapCanvas = dynamic(() => import("./MapCanvas").then((x) => x.MapCanvas), {
  ssr: false, loading: () => <p className="grid size-full place-items-center text-meta text-ink-soft">{m.loadingMap}</p>,
});

type LatLng = { lat: number; lng: number };
const r4 = (n: number) => n.toFixed(4); // ~11 m: all the precision the geocoder needs, and less to leak

/**
 * Inline "live location" panel inside the address form: "Use my current location" or "Open map" expands it in place
 * (no modal). Live GPS dot + accuracy circle, fixed centre pin over a draggable map, search, and the reverse-geocoded
 * address with "Use this address", which writes the fields into the form and collapses the panel.
 */
export function LocationPicker({ onConfirm }: { onConfirm: (fields: AddressFields) => void }) {
  const reduce = useReducedMotion();
  const { status, fix, locate, stop } = useGeolocation();
  const [open, setOpen] = useState(false);
  const [clip, setClip] = useState(true); // overflow hidden only while the height animates (search list may overhang)
  const [follow, setFollow] = useState(true); // follow GPS refinements until the shopper moves the map
  const [manual, setManual] = useState<(LatLng & { zoom: number }) | null>(null);
  const [nonce, setNonce] = useState(0); // recenter: a fresh target re-flies to the fix
  const [addr, setAddr] = useState<Resolved | null>(null);
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const timers = useRef({ rev: 0, search: 0, seq: 0 });
  const toggle = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const target = useMemo(() => (follow && fix ? { lat: fix.lat, lng: fix.lng, zoom: zoomFor(fix.accuracy), nonce } : manual), [follow, fix, manual, nonce]);
  const tracking = status === "locating" || status === "refining";

  function expand() { if (!open) { setClip(true); setOpen(true); } } // already open: no animation would clear clip
  function collapse() { setClip(true); setOpen(false); stop(); }
  function start() { expand(); setFollow(true); setManual(null); locate(); }
  function recenter() { setFollow(true); setNonce((n) => n + 1); if (!tracking) locate(); }

  function onCenter(c: LatLng, byUser: boolean) {
    if (byUser) setFollow(false);
    if (!target && !byUser) return; // initial whole-India view: nothing to name yet
    clearTimeout(timers.current.rev);
    setAddr({ loading: true, fields: null });
    const seq = ++timers.current.seq;
    // debounced; the server also queues Nominatim at 1 req/s and caches each rounded point
    timers.current.rev = window.setTimeout(async () => {
      const r = await api<AddressFields>(`/api/geo/reverse?lat=${r4(c.lat)}&lng=${r4(c.lng)}`);
      if (seq === timers.current.seq) setAddr({ loading: false, fields: r.ok ? r.data : null });
    }, 500);
  }

  function search(text: string) {
    setQ(text);
    clearTimeout(timers.current.search);
    if (text.trim().length < 3) return setPlaces([]);
    setSearching(true);
    timers.current.search = window.setTimeout(async () => {
      const r = await api<Place[]>(`/api/geo/search?q=${encodeURIComponent(text.trim())}`);
      setSearching(false);
      setPlaces(r.ok ? r.data : []);
    }, 300);
  }

  function pickPlace(label: string) {
    clearTimeout(timers.current.search); // picking writes the label into the box: don't search for it
    setSearching(false);
    const p = places.find((x) => x.label === label);
    if (!p) return;
    setFollow(false);
    setManual({ lat: p.lat, lng: p.lng, zoom: 17 });
  }

  function use(f: AddressFields) { onConfirm(f); collapse(); toggle.current?.focus(); }

  // The panel sits inside the address <form>: Enter in the search box must not submit it.
  const noSubmit = (e: KeyboardEvent) => { if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault(); };

  return (
    <div className={clsx("rounded-xl border border-line bg-surface transition-shadow duration-(--dur-base)", open ? "shadow-lg" : "shadow-sm")}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-surface-warm text-ink" aria-hidden><Navigation className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-ink">{m.title}</p>
          <p className="text-meta text-ink-soft">{m.subtitle}</p>
        </div>
        <div className="flex gap-2 max-sm:w-full">
          <Button type="button" variant="secondary" onClick={start} className="max-sm:flex-1 max-sm:px-4">
            <LocateFixed className="size-4" aria-hidden /> {addressCopy.useLocation}
          </Button>
          <Button ref={toggle} type="button" variant="ghost" aria-expanded={open} aria-controls={panelId} onClick={open ? collapse : expand} className="px-4">
            {open ? m.hideMap : m.showMap}
            <ChevronDown className={clsx("size-4 transition-transform duration-(--dur-base)", open && "rotate-180")} aria-hidden />
          </Button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={panelId} key="panel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={() => setClip(false)}
            className={clsx(clip && "overflow-hidden")} onKeyDown={noSubmit}>
            <div className="grid gap-4 border-t border-line p-4">
              <Combobox label={m.search} placeholder={m.searchPlaceholder} freeText filter={false} value={q} onChange={search}
                onSelect={pickPlace} options={places.map((p) => p.label)} loading={searching} />
              <div className="relative h-[min(55dvh,26rem)] min-h-72 overflow-hidden rounded-lg border border-line bg-surface-2">
                <MapCanvas target={target} fix={fix} onCenter={onCenter} onRecenter={recenter} />
                <StatusStrip status={status} accuracy={fix?.accuracy} />
              </div>
              {isProblem(status) ? <ProblemCard status={status} onRetry={locate} />
                : <p className="text-meta text-ink-soft">{fix && fix.accuracy > 100 ? m.coarse : m.drag}</p>}
              <AddressCard addr={addr} onUse={use} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
