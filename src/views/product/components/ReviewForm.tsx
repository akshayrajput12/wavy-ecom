"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { reviewsCopy as c } from "@/data/copy";
import { reviewFormCopy as f } from "@/data/storefront";

type Status = "idle" | "sending" | "done" | "signin" | "error" | "duplicate";

/** POST /api/reviews (signed in). A 401 swaps the form for a sign-in prompt; reviews publish after moderation. */
export function ReviewForm({ open, onClose, productId, productName }: { open: boolean; onClose: () => void; productId: string; productName: string }) {
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      productId, rating,
      title: String(form.get("title") ?? ""), body: String(form.get("body") ?? ""),
      authorName: String(form.get("authorName") ?? ""), authorLocation: String(form.get("authorLocation") ?? "") || undefined,
    };
    setStatus("sending");
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) return setStatus("signin");
      if (res.status === 409) return setStatus("duplicate");
      const json = (await res.json()) as { ok: boolean; error?: { details?: Record<string, string[]> } };
      if (!json.ok) { setErrors(json.error?.details ?? {}); return setStatus("error"); }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const err = (k: string) => errors[k]?.[0];
  return (
    <Modal open={open} onClose={onClose} title={`${c.write}: ${productName}`}>
      {status === "done" ? (
        <p role="status" className="py-6 text-body-lg text-success">✓ {c.submitted}</p>
      ) : status === "signin" ? (
        <div role="status" className="space-y-4 py-4">
          <p className="text-body-lg">{c.signInToReview}</p>
          <Link href={`/login?next=${encodeURIComponent(typeof window === "undefined" ? "/" : location.pathname)}`} className="inline-flex h-11 items-center rounded-pill bg-ink px-6 font-medium text-on-dark">{f.signIn}</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <fieldset>
            <legend className="text-meta font-medium">{f.rating}</legend>
            <div className="mt-1 flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="grid size-11 cursor-pointer place-items-center rounded-pill has-focus-visible:outline-2 has-focus-visible:outline-focus">
                  <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" required />
                  <span className="sr-only">{f.star(n)}</span>
                  <Star className={clsx("size-6 transition-colors", n <= rating ? "fill-rating text-rating" : "text-line")} strokeWidth={1.5} aria-hidden />
                </label>
              ))}
            </div>
            {err("rating") && <p className="text-meta text-danger">⚠ {err("rating")}</p>}
          </fieldset>
          <Input label={f.title} name="title" required minLength={2} maxLength={120} error={err("title")} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-body" className="text-meta font-medium">{f.body}</label>
            <textarea id="review-body" name="body" required minLength={10} maxLength={4000} rows={5} aria-describedby="review-body-msg"
              className="rounded-sm border border-line bg-surface p-3 text-body focus:border-ink focus:outline-none" />
            <p id="review-body-msg" className={clsx("text-meta", err("body") ? "text-danger" : "text-ink-soft")}>{err("body") ? `⚠ ${err("body")}` : f.bodyHint}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={f.name} name="authorName" required maxLength={80} autoComplete="name" error={err("authorName")} />
            <Input label={f.location} name="authorLocation" maxLength={80} autoComplete="address-level2" />
          </div>
          {(status === "error" || status === "duplicate") && (
            <p role="alert" className="text-meta text-danger">⚠ {status === "duplicate" ? f.duplicate : f.failed}</p>
          )}
          <Button type="submit" full loading={status === "sending"} disabled={!rating}>{c.submit}</Button>
        </form>
      )}
    </Modal>
  );
}
