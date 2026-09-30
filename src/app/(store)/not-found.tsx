import { ButtonLink } from "@/components/ui/Button";
import { pageStates } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";

export default function NotFound() {
  const c = pageStates.notFound;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-20 text-center">
      <div>
        <p className="font-serif text-hero leading-none text-accent-deep" aria-hidden>404</p>
        <h1 className="t-display mt-4">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-body-lg text-ink-soft">{c.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">{c.cta}</ButtonLink>
          <ButtonLink href="/collections" variant="secondary">{collectionCopy.browse}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
