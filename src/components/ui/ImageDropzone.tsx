"use client";

import { clsx } from "clsx";
import { ArrowDown, ArrowUp, ImagePlus, X } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { adminCopy } from "@/data/copy";
import { IMAGE_ACCEPT, formatList, planPicks, skippedMessage } from "./imagePicks";
import { SafeImage } from "./SafeImage";

/** A local image entry. `file` is set for new picks (url is a blob: preview); absent for already-uploaded images. */
export type DropzoneImage = { id: string; url: string; alt: string; file?: File };

type Props = {
  value: DropzoneImage[];
  onChange: (images: DropzoneImage[]) => void;
  label: string;
  hint?: string;
  error?: string;
  max?: number;
  maxSizeMb?: number;
  /** Comma-separated MIME types. Defaults to what every image bucket accepts. */
  accept?: string;
};

const copy = adminCopy.dropzone;
const move = <T,>(arr: T[], from: number, to: number) => {
  const next = [...arr];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};
const revoke = (img: DropzoneImage) => { if (img.file) URL.revokeObjectURL(img.url); };

/**
 * Drag-and-drop / click-to-pick image manager: previews, reorder (drag or arrow buttons), remove, alt text.
 * Only manages local state and calls `onChange`; the caller uploads `file`s. First image is the cover.
 * max=1: a new pick replaces the current image. Skipped files are listed by name with the reason.
 */
export function ImageDropzone({ value, onChange, label, hint, error, max = 12, maxSizeMb = 8, accept = IMAGE_ACCEPT }: Props) {
  const inputId = useId();
  const msgId = `${inputId}-msg`;
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);
  const single = max === 1;
  const rules = { max, maxSizeMb, accept };

  const add = (files: FileList | File[]) => {
    const plan = planPicks(Array.from(files), value.length, rules);
    setRejected(skippedMessage(plan.skipped, rules));
    if (!plan.accepted.length) return;
    const added = plan.accepted.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), alt: "", file }));
    if (plan.replace) value.forEach(revoke);
    onChange(plan.replace ? added : [...value, ...added]);
  };

  // ponytail: blob URLs are revoked on remove/replace only; ones still in `value` on unmount belong to the caller.
  const remove = (i: number) => {
    revoke(value[i]);
    onChange(value.filter((_, j) => j !== i));
  };

  const onZoneDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files.length) add(e.dataTransfer.files);
  };

  const onItemDrop = (e: DragEvent, to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from === null) return; // a file drop: let it bubble to the zone
    e.preventDefault();
    e.stopPropagation();
    if (from !== to) onChange(move(value, from, to));
  };

  const message = error ?? rejected ?? hint ?? copy.hint(formatList(accept), maxSizeMb);
  const alert = !!(error || rejected);
  const iconBtn = "grid size-11 shrink-0 place-items-center rounded-pill text-ink-soft transition-colors hover:bg-surface-warm hover:text-ink disabled:opacity-30";

  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      onDragOver={(e) => { e.preventDefault(); if (dragFrom.current === null) setOver(true); }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(false)}
      onDrop={onZoneDrop}
    >
      <label
        htmlFor={inputId}
        className={clsx(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors sm:px-6",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
          over ? "border-accent-deep bg-accent-soft" : error ? "border-danger bg-surface" : "border-line bg-surface hover:border-ink-muted",
        )}
      >
        <ImagePlus className="size-6 text-ink-soft" aria-hidden />
        <span className="text-body font-medium text-ink">{label}</span>
        <span className="text-meta text-ink-soft">{single ? (value.length ? copy.replaceOne : copy.browseOne) : copy.browse}</span>
        <input
          id={inputId}
          type="file"
          multiple={!single}
          accept={accept}
          className="sr-only"
          aria-invalid={!!error}
          aria-describedby={msgId}
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }}
        />
      </label>
      <p id={msgId} role={alert ? "alert" : undefined} className={clsx("text-meta break-words", alert ? "text-danger" : "text-ink-soft")}>{alert ? `⚠ ${message}` : message}</p>

      {value.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label={copy.selected}>
          {value.map((img, i) => (
            <li
              key={img.id}
              draggable={value.length > 1}
              onDragStart={(e) => { dragFrom.current = i; e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { dragFrom.current = null; }}
              onDrop={(e) => onItemDrop(e, i)}
              className="flex min-w-0 gap-2 rounded-md border border-line bg-surface p-2 sm:gap-3"
            >
              <div className={clsx("relative size-16 shrink-0 overflow-hidden rounded-sm bg-surface-2 sm:size-20", value.length > 1 && "cursor-grab active:cursor-grabbing")}>
                <SafeImage src={img.url} alt="" sizes="80px" compact />
                {i === 0 && !single && <span className="absolute left-1 top-1 rounded-pill bg-ink px-1.5 text-micro text-on-dark">{copy.cover}</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor={`${inputId}-alt-${img.id}`} className="text-micro font-medium text-ink-soft">{copy.alt(i + 1)}</label>
                <input
                  id={`${inputId}-alt-${img.id}`}
                  value={img.alt}
                  placeholder={copy.altPlaceholder}
                  onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt: e.target.value } : v)))}
                  className="h-11 w-full min-w-0 rounded-sm border border-line bg-surface px-2.5 text-meta text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
                />
              </div>
              {value.length > 1 && (
                <div className="flex flex-col">
                  <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0} aria-label={copy.up(i + 1)}><ArrowUp className="size-4" aria-hidden /></button>
                  <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i + 1))} disabled={i === value.length - 1} aria-label={copy.down(i + 1)}><ArrowDown className="size-4" aria-hidden /></button>
                </div>
              )}
              <button type="button" className={iconBtn} onClick={() => remove(i)} aria-label={copy.remove(i + 1)}><X className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
