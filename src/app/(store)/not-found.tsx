import { ButtonLink } from "@/components/ui/Button";
import { pageStates } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";

export default function NotFound() {
  const c = pageStates.notFound;
  return (
    <div className="container-x grid min-h-[75svh] place-items-center pb-20 pt-12 text-center">
      <div className="grid justify-items-center gap-5">
        <p className="t-index text-ink-soft">{c.code}</p>
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
