"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { pageStates } from "@/data/copy";

// Server-side failures are already logged by Next with the digest; this only renders recovery UI.
export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const c = pageStates.error;
  return (
    <div role="alert" className="container-x grid min-h-[70svh] place-items-center pb-20 pt-12 text-center">
      <div className="grid justify-items-center gap-5">
        <p className="t-overline">{c.overline}</p>
        <h1 className="t-hero max-w-3xl">{c.title}</h1>
        <p className="max-w-md text-body-lg text-ink-soft">{c.body}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>{c.retry}</Button>
          <ButtonLink href="/" size="lg" variant="secondary">{pageStates.notFound.cta}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
