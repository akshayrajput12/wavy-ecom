import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { ImageWell } from "@/components/commerce/ImageWell";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeSectionOf } from "@/types/domain";
import { CouponPill } from "./CouponPill";

type Promo = HomeSectionOf<"promo_banner">;

/** Dark: inset CTA band, centred heading, image rising from the bottom edge over a soft glow of itself. */
function DarkBand({ section: { title, config: c } }: { section: Promo }) {
  return (
    <section className="px-2 py-(--section-y) sm:px-3">
      <Reveal className="on-dark relative isolate overflow-hidden rounded-xl text-center">
        <div className="container-x pt-16 sm:pt-24">
          {title && <p className="t-overline">{title}</p>}
          <h2 className="t-hero mx-auto mt-4 max-w-3xl">{c.heading}</h2>
          {c.body && <p className="mx-auto mt-5 max-w-md text-body text-ink-soft">{c.body}</p>}
          {(c.cta || c.couponCode) && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {c.cta && <ButtonLink href={c.cta.href} size="lg">{c.cta.label}<ChevronRight className="size-4" aria-hidden /></ButtonLink>}
              {c.couponCode && <CouponPill code={c.couponCode} />}
            </div>
          )}
        </div>
        <div className="relative mx-auto mt-12 w-[min(92%,56rem)] sm:mt-16">
          <div className="absolute inset-x-[10%] -bottom-6 top-1/3 -z-10 overflow-hidden opacity-70 blur-3xl saturate-150" aria-hidden>
            <Image src={c.image} alt="" fill sizes="30vw" className="object-cover" />
          </div>
          <div className="relative aspect-[16/7] overflow-hidden rounded-t-lg">
            <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 1024px) 56rem, 92vw" className="object-cover" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/** Light: feature split, large rounded image left, copy right. */
function FeatureSplit({ section: { title, config: c } }: { section: Promo }) {
  return (
    <section className="container-x section-y">
      <Reveal className="grid items-center gap-10 md:grid-cols-12 lg:gap-16">
        <ImageWell media={{ url: c.image, alt: c.imageAlt }} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/5] rounded-xl md:col-span-6" />
        <div className="md:col-span-6 lg:col-span-5">
          {title && <p className="t-overline">{title}</p>}
          <h2 className="t-display mt-4">{c.heading}</h2>
          {c.body && <p className="mt-5 max-w-md text-body text-ink-soft">{c.body}</p>}
          {c.couponCode && <div className="mt-6 border-t border-line pt-6"><CouponPill code={c.couponCode} /></div>}
          {c.cta && (
            <ButtonLink href={c.cta.href} variant="link" className="mt-6 min-h-11">
              {c.cta.label}<ChevronRight className="size-4" aria-hidden />
            </ButtonLink>
          )}
        </div>
      </Reveal>
    </section>
  );
}

export function PromoBanner({ section }: { section: Promo }) {
  return section.config.theme === "dark" ? <DarkBand section={section} /> : <FeatureSplit section={section} />;
}
