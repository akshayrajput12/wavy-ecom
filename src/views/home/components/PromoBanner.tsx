import { clsx } from "clsx";
import { ImageWell } from "@/components/commerce/ImageWell";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";

export function PromoBanner({ section }: { section: HomeSectionOf<"promo_banner"> }) {
  const c = section.config;
  const dark = c.theme === "dark";
  return (
    <section className="container-x section-y">
      <Reveal className={clsx("grid overflow-hidden rounded-xl md:grid-cols-2", dark ? "bg-black text-on-dark" : "bg-accent-soft text-ink")}>
        <div className="flex flex-col justify-center gap-4 p-8 sm:p-12 lg:p-16">
          <h2 className="t-display">{c.heading}</h2>
          {c.body && <p className="max-w-md text-body-lg opacity-85">{c.body}</p>}
          {c.couponCode && (
            <p className="text-meta">
              {homeCopy.useCode}{" "}
              <span className={clsx("ml-1 rounded-pill border border-dashed px-3 py-1 font-semibold tracking-wide", dark ? "border-on-dark/50" : "border-ink/40")}>{c.couponCode}</span>
            </p>
          )}
          {c.cta && <ButtonLink href={c.cta.href} variant={dark ? "accent" : "primary"} size="lg" className="mt-2 self-start">{c.cta.label}</ButtonLink>}
        </div>
        <ImageWell media={{ url: c.image, alt: c.imageAlt }} sizes="(min-width: 768px) 50vw, 100vw" className="min-h-72" />
      </Reveal>
    </section>
  );
}
