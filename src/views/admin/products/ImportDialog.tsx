"use client";

import { clsx } from "clsx";
import { Download, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Button, buttonClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { type ImportSummary, MAX_FILE_BYTES, MAX_ROWS, XLSX_TYPE } from "@/backend/catalog-import/columns";
import { catalogImportCopy as c } from "@/data/copy";
import { adminApi } from "../api";
import { changeCount, ImportPreview } from "./ImportPreview";

const MB = MAX_FILE_BYTES / 1_048_576;
const isSummary = (v: unknown): v is ImportSummary => !!v && typeof v === "object" && "counts" in v && "errors" in v;

/**
 * Template download -> upload -> server dry run (counts + row errors) -> confirm. Confirm sends the same file
 * again: the server re-validates it from scratch and imports it in one transaction.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [over, setOver] = useState(false);

  const close = () => { setFile(null); setSummary(null); setProblem(null); onClose(); };
  const pick = (f: File | undefined) => {
    setSummary(null);
    if (!f) return;
    const bad = !/\.xlsx$/i.test(f.name) ? c.wrongType : f.size > MAX_FILE_BYTES ? c.tooBig(MB) : null;
    setProblem(bad);
    setFile(bad ? null : f);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); };

  const send = async (mode: "preview" | "commit") => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("mode", mode);
    setBusy(mode);
    const res = await adminApi<ImportSummary>("POST", "catalog-import", form);
    setBusy(null);
    if (res.ok && mode === "commit") {
      toast.success(c.done(changeCount(res.data)));
      router.refresh();
      close();
    } else if (res.ok) setSummary(res.data);
    else if (isSummary(res.details)) setSummary(res.details);   // commit re-validation found new problems
    else toast.error(mode === "commit" ? c.failed : c.checkFailed, { description: res.error });
  };

  const ready = !!summary && !summary.errorCount && changeCount(summary) > 0;
  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button type="button" variant="ghost" onClick={close}>{summary && !ready ? c.close : c.cancel}</Button>
      {ready
        ? <Button type="button" loading={busy === "commit"} onClick={() => send("commit")}>{c.confirm(changeCount(summary))}</Button>
        : !summary && <Button type="button" disabled={!file} loading={busy === "preview"} onClick={() => send("preview")}>{c.check}</Button>}
    </div>
  );

  return (
    <Modal open={open} onClose={close} title={c.title} size="lg" footer={footer}>
      <div className="grid gap-5">
        <p className="text-body text-ink-soft">{c.intro}</p>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/api/admin/catalog-import" download className={buttonClass({ variant: "secondary", size: "md" })}>
            <Download className="size-4" aria-hidden />{c.download}
          </a>
          <span className="t-meta">{c.templateHint}</span>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={inputId}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            className={clsx(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
              over ? "border-accent-deep bg-accent-soft" : problem ? "border-danger bg-surface" : "border-line bg-surface hover:border-ink-muted",
            )}
          >
            <FileSpreadsheet className="size-6 text-ink-soft" aria-hidden />
            <span className="text-body font-medium text-ink">{c.fileLabel}</span>
            <span className="text-meta text-ink-soft">{file ? c.chosen(file.name) : c.browse}</span>
            <input id={inputId} type="file" accept={`.xlsx,${XLSX_TYPE}`} className="sr-only" aria-describedby={`${inputId}-msg`} aria-invalid={!!problem}
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <p id={`${inputId}-msg`} role={problem ? "alert" : undefined} className={clsx("text-meta", problem ? "text-danger" : "text-ink-soft")}>
            {problem ?? c.fileHint(MB, MAX_ROWS)}
          </p>
        </div>

        {summary && (
          <>
            <ImportPreview summary={summary} />
            {!ready && <Button type="button" variant="secondary" className="justify-self-start" onClick={() => { setSummary(null); setFile(null); }}>{c.another}</Button>}
          </>
        )}
      </div>
    </Modal>
  );
}
