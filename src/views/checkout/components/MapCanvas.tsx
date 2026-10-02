"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { animate, motion } from "framer-motion";
import { LocateFixed, MapPin, Minus, Plus } from "lucide-react";
import { Map as MapLibre, Marker, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { addressCopy } from "@/data/copy";
import { accuracyRing } from "./geoMath";
import type { Fix } from "./useGeolocation";

/**
 * MapLibre GL (BSD-3) + OpenFreeMap "positron" vector tiles (free, keyless, commercial use OK; attribution is
 * rendered by MapLibre from the style). Loaded only via next/dynamic when the location panel first opens.
 * The pin is fixed at the centre: dragging the map (mouse, touch, or arrow keys on the focused map) moves it.
 * v6 resolves its worker via import.meta.url, which bundlers break: the worker files are copied to /public/maplibre
 * by the postinstall script.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const m = addressCopy.map;
const STYLE = "https://tiles.openfreemap.org/styles/positron";
// India borders on OSM differ from the official map of India: hide boundary lines (irrelevant at street zoom anyway).
const HIDDEN = ["boundary_2", "boundary_3", "boundary_disputed"];
// layer -> [paint property, colour token]: tint the basemap with the site palette (values read from :root at runtime).
const TINT: [string, "background-color" | "fill-color", string][] = [
  ["background", "background-color", "--canvas"], ["water", "fill-color", "--accent"], ["park", "fill-color", "--surface-warm"],
];
const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const GLASS = "grid size-11 place-items-center rounded-pill border border-line bg-surface/80 text-ink shadow-md backdrop-blur-md transition-colors duration-(--dur-fast) hover:bg-surface"; // focus ring: global :focus-visible

type LatLng = { lat: number; lng: number };
type Props = {
  /** Fly here when it changes (search result, GPS fix, recenter). */
  target: (LatLng & { zoom?: number }) | null;
  /** Best GPS fix: "you are here" dot + accuracy circle. */
  fix: Fix | null;
  /** Map centre (= pin) after every move; `byUser` = drag/keys/scroll by the shopper. */
  onCenter: (c: LatLng, byUser: boolean) => void;
  /** Recenter button: back to (or find) the shopper's location. */
  onRecenter: () => void;
};

export function MapCanvas({ target, fix, onCenter, onRecenter }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibre | null>(null);
  const you = useRef<Marker | null>(null);
  const radius = useRef(0); // accuracy circle radius currently drawn, tweened towards the latest fix
  const cb = useRef(onCenter);
  const [moving, setMoving] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => { cb.current = onCenter; });

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (n: string) => css.getPropertyValue(n).trim();
    const mp = new MapLibre({
      container: el.current!, style: STYLE, center: [78.9, 22.6], zoom: 4, minZoom: 3, maxZoom: 19,
      attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false,
    });
    mp.touchZoomRotate.disableRotation();
    mp.getCanvas().setAttribute("aria-label", m.region);
    mp.on("load", () => {
      for (const id of HIDDEN) if (mp.getLayer(id)) mp.setLayoutProperty(id, "visibility", "none");
      for (const [id, prop, t] of TINT) if (mp.getLayer(id) && token(t)) mp.setPaintProperty(id, prop, token(t));
      mp.addSource("accuracy", { type: "geojson", data: EMPTY });
      mp.addLayer({ id: "accuracy-fill", type: "fill", source: "accuracy", paint: { "fill-color": token("--ink"), "fill-opacity": 0.08 } });
      mp.addLayer({ id: "accuracy-line", type: "line", source: "accuracy", paint: { "line-color": token("--ink"), "line-opacity": 0.4, "line-width": 1.5 } });
    });
    mp.on("movestart", () => setMoving(true));
    mp.on("moveend", (e) => { setMoving(false); const c = mp.getCenter(); cb.current({ lat: c.lat, lng: c.lng }, !!e.originalEvent); });
    map.current = mp;
    return () => { mp.remove(); map.current = null; you.current = null; };
  }, []);

  useEffect(() => {
    // MapLibre's flyTo already jumps instead of flying under prefers-reduced-motion.
    if (target) map.current?.flyTo({ center: [target.lng, target.lat], zoom: target.zoom ?? 17, speed: 1.4, curve: 1.5 });
  }, [target]);

  useEffect(() => {
    const mp = map.current;
    if (!mp) return;
    if (!fix) { you.current?.remove(); you.current = null; radius.current = 0; return; }
    if (!you.current) you.current = new Marker({ element: youAreHere() }).setLngLat([fix.lng, fix.lat]).addTo(mp);
    else you.current.setLngLat([fix.lng, fix.lat]);
    const draw = (r: number) => { radius.current = r; (mp.getSource("accuracy") as GeoJSONSource | undefined)?.setData(accuracyRing(fix.lat, fix.lng, r)); };
    let run: { stop: () => void } | undefined;
    const go = () => {
      // first fix: the ring grows in from a quarter; refinements shrink it smoothly
      const from = radius.current || fix.accuracy * 0.25;
      run = animate(from, fix.accuracy, { duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: draw });
    };
    if (mp.getSource("accuracy")) go(); else mp.once("load", go);
    return () => { run?.stop(); mp.off("load", go); };
  }, [fix, reduce]);

  return (
    <div className="relative size-full">
      {/* size-full, not absolute: the library CSS gives .maplibregl-map position: relative (unlayered, beats utilities) */}
      <div ref={el} className="size-full" />
      <CenterPin lifted={moving} />
      <div className="absolute right-3 top-3 grid gap-2">
        <button type="button" className={GLASS} aria-label={m.zoomIn} onClick={() => map.current?.zoomIn()}><Plus className="size-4" aria-hidden /></button>
        <button type="button" className={GLASS} aria-label={m.zoomOut} onClick={() => map.current?.zoomOut()}><Minus className="size-4" aria-hidden /></button>
        <button type="button" className={`${GLASS} mt-2`} aria-label={fix ? m.recenter : m.locate} onClick={onRecenter}>
          <LocateFixed className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Fixed centre pin: lifts while the map moves, drops with a small bounce when it settles; its shadow tracks the height. */
function CenterPin({ lifted }: { lifted: boolean }) {
  const drop = { type: "spring", stiffness: 520, damping: 13, mass: 0.6 } as const;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      <motion.span className="absolute h-1.5 w-5 -translate-1/2 rounded-pill bg-ink/35 blur-[1.5px]"
        animate={lifted ? { scale: 0.55, opacity: 0.45 } : { scale: 1, opacity: 1 }} transition={lifted ? { duration: 0.18 } : drop} />
      <motion.div className="absolute -translate-x-1/2 -translate-y-full"
        animate={{ y: lifted ? -14 : 0 }} transition={lifted ? { duration: 0.18, ease: "easeOut" } : drop}>
        <MapPin className="size-10 fill-ink text-surface drop-shadow-md" strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

/** "You are here" dot with two sonar rings (styles + keyframes: "Location tracker" block in globals.css). */
function youAreHere() {
  const dot = document.createElement("div");
  dot.className = "map-you";
  dot.setAttribute("aria-hidden", "true");
  for (const c of ["map-you-ring", "map-you-ring", "map-you-core"]) dot.appendChild(document.createElement("span")).className = c;
  return dot;
}
