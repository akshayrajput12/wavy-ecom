import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { plainText } from "@/lib/format";
import type { Cta } from "@/types/domain";
import { HeadingLines } from "./HeadingLines";

/** Small underlined "View all ›" style link. `context` is appended for screen readers ("View all: New arrivals"). */
export function MoreLink({ cta, context }: { cta: Cta; context?: string }) {
  return (
    <Link href={cta.href} className="group inline-flex min-h-11 shrink-0 items-center gap-1 self-start text-meta font-medium underline decoration-line underline-offset-4 transition-colors hover:decoration-ink sm:self-end">
      {cta.label}
      {context && <span className="sr-only">: {context}</span>}
      <ChevronRightIcon className="size-3.5" />
    </Link>
  );
}

/** Overline + 2-line display heading (subtitle = greyed second line) left, "View all ›" bottom-right; stacks on mobile. */
export function SectionHead({ overline, title, subtitle, cta }: { overline?: string; title?: string; subtitle?: string; cta?: Cta }) {
  if (!title && !cta) return null;
  return (
    <div className="mb-(--head-gap) flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="max-w-3xl">
        {overline && <p className="t-overline mb-4">{overline}</p>}
        {title && <HeadingLines line={title} soft={subtitle} />}
      </div>
      {cta && <MoreLink cta={cta} context={title && plainText(title)} />}
    </div>
  );
}
