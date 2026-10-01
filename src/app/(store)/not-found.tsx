import { ButtonLink } from "@/components/ui/Button";
import { TearReveal } from "@/components/ui/TearReveal";
import { pageStates } from "@/data/copy";
import { collectionCopy, tearRevealCopy } from "@/data/storefront";

export default function NotFound() {
  const c = pageStates.notFound;
  return (
    <div className="pb-20">
      {/* controlled at 1: torn open from the start, the tiger peeking through, no scroll runway */}
      <TearReveal word={tearRevealCopy.notFoundWord} progress={1} height="min(62svh, 80vw)" />
      <div className="container-x grid justify-items-center gap-5 pt-8 text-center">
        <h1 className="t-hero max-w-3xl">{c.title}</h1>
        <p className="max-w-md text-body-lg text-ink-soft">{c.body}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">{c.cta}</ButtonLink>
          <ButtonLink href="/collections" size="lg" variant="secondary">{collectionCopy.browse}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
