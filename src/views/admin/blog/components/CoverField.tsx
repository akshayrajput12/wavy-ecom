"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminApi } from "../../api";

/** Cover image: upload to content-media (POST /api/admin/uploads) or paste a URL. */
export function CoverField({ url, alt, onUrl, onAlt, error }: { url: string; alt: string; onUrl: (v: string) => void; onAlt: (v: string) => void; error?: string }) {
  const [busy, setBusy] = useState(false);
  async function pick(file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file); fd.set("bucket", "content-media"); fd.set("folder", "blog");
    setBusy(true);
    const res = await adminApi<{ url: string }>("POST", "uploads", fd);
    setBusy(false);
    if (res.ok) onUrl(res.data.url); else toast.error("Upload failed", { description: res.error });
  }
  return (
    <div className="grid gap-3">
      {url && <Image src={url} alt={alt || "Cover preview"} width={640} height={360} unoptimized className="aspect-video w-full max-w-md rounded-md border border-line object-cover" />}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-11 cursor-pointer items-center rounded-pill border border-ink px-4 text-meta hover:bg-ink hover:text-on-dark focus-within:outline-2">
          {busy ? "Uploading..." : url ? "Replace image" : "Upload image"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
        {url && <Button type="button" size="sm" variant="ghost" onClick={() => onUrl("")}>Remove</Button>}
      </div>
      <Input label="Cover URL" value={url} onChange={(e) => onUrl(e.target.value)} error={error} />
      <Input label="Cover alt text" value={alt} onChange={(e) => onAlt(e.target.value)} />
    </div>
  );
}
