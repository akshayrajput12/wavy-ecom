import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Cta } from "@/types/domain";

/** Section title row with an optional "view all" link. */
export function SectionHead({ title, subtitle, cta }: { title?: string; subtitle?: string; cta?: Cta }) {
  if (!title && !cta) return null;
  return (
    <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
      <div>
        {title && <h2 className="t-display text-balance">{title}</h2>}
        {subtitle && <p className="mt-2 max-w-xl text-body-lg text-ink-soft">{subtitle}</p>}
      </div>
      {cta && (
        <Link href={cta.href} className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-body font-medium">
          {cta.label} <ArrowRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
