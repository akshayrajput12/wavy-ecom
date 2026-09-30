"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { pageStates } from "@/data/copy";

// Server-side failures are already logged by Next with the digest; this only renders recovery UI.
export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const c = pageStates.error;
  return (
    <div role="alert" className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <h1 className="t-display">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-body-lg text-ink-soft">{c.body}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>{c.retry}</Button>
          <ButtonLink href="/" variant="secondary">{pageStates.notFound.cta}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
