"use client";

import { clsx } from "clsx";
import { ArrowDown, ArrowUp, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";

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
  accept?: string;
};

const move = <T,>(arr: T[], from: number, to: number) => {
  const next = [...arr];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

/**
 * Drag-and-drop / click-to-pick image manager: previews, reorder (drag or arrow buttons), remove, alt text.
 * Only manages local state and calls `onChange`; the caller uploads `file`s. First image is the cover.
 */
export function ImageDropzone({ value, onChange, label, hint, error, max = 12, maxSizeMb = 8, accept = "image/*" }: Props) {
  const inputId = useId();
  const msgId = `${inputId}-msg`;
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  const add = (files: FileList | File[]) => {
    const list = Array.from(files);
    const ok = list.filter((f) => f.type.startsWith("image/") && f.size <= maxSizeMb * 1024 * 1024);
    const room = Math.max(0, max - value.length);
    const skipped = list.length - Math.min(ok.length, room);
    setRejected(skipped > 0 ? `${skipped} file(s) skipped: images only, up to ${maxSizeMb} MB each, ${max} max.` : null);
    const added = ok.slice(0, room).map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), alt: "", file }));
    if (added.length) onChange([...value, ...added]);
  };

  // ponytail: blob URLs are revoked on remove only; ones still in `value` on unmount belong to the caller.
  const remove = (i: number) => {
    const img = value[i];
    if (img.file) URL.revokeObjectURL(img.url);
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

  const message = error ?? rejected ?? hint;
  const iconBtn = "grid size-11 place-items-center rounded-pill text-ink-soft transition-colors hover:bg-surface-warm hover:text-ink disabled:opacity-30";

  return (
    <div
      className="flex flex-col gap-3"
      onDragOver={(e) => { e.preventDefault(); if (dragFrom.current === null) setOver(true); }}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setOver(false)}
      onDrop={onZoneDrop}
    >
      <label
        htmlFor={inputId}
        className={clsx(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
          over ? "border-accent-deep bg-accent-soft" : error ? "border-danger bg-surface" : "border-line bg-surface hover:border-ink-muted",
        )}
      >
        <ImagePlus className="size-6 text-ink-soft" aria-hidden />
        <span className="text-body font-medium text-ink">{label}</span>
        <span className="text-meta text-ink-soft">Drag images here or click to browse</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          aria-invalid={!!error}
          aria-describedby={message ? msgId : undefined}
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }}
        />
      </label>
      {message && <p id={msgId} role={error || rejected ? "alert" : undefined} className={clsx("text-meta", error || rejected ? "text-danger" : "text-ink-soft")}>{error || rejected ? `⚠ ${message}` : message}</p>}

      {value.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Selected images">
          {value.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={(e) => { dragFrom.current = i; e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { dragFrom.current = null; }}
              onDrop={(e) => onItemDrop(e, i)}
              className="flex gap-3 rounded-md border border-line bg-surface p-2"
            >
              <div className="relative size-20 shrink-0 cursor-grab overflow-hidden rounded-sm bg-surface-2 active:cursor-grabbing">
                <Image src={img.url} alt="" fill unoptimized sizes="80px" className="object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-pill bg-ink px-1.5 text-micro text-on-dark">Cover</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor={`${inputId}-alt-${img.id}`} className="text-micro font-medium text-ink-soft">Alt text, image {i + 1}</label>
                <input
                  id={`${inputId}-alt-${img.id}`}
                  value={img.alt}
                  placeholder="Describe the image"
                  onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, alt: e.target.value } : v)))}
                  className="h-10 rounded-sm border border-line bg-surface px-2.5 text-meta text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0} aria-label={`Move image ${i + 1} up`}><ArrowUp className="size-4" aria-hidden /></button>
                <button type="button" className={iconBtn} onClick={() => onChange(move(value, i, i + 1))} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} down`}><ArrowDown className="size-4" aria-hidden /></button>
              </div>
              <button type="button" className={iconBtn} onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`}><X className="size-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
