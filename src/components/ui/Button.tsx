import { clsx } from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary: "bg-ink text-on-dark hover:bg-black",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-on-dark",
  accent: "bg-accent text-ink hover:bg-accent-hover",
  ghost: "text-ink hover:bg-surface-warm",
  link: "text-ink underline underline-offset-4 hover:text-accent-deep px-0 h-auto",
} as const;
const sizes = { sm: "h-9 px-4 text-meta", md: "h-11 px-6 text-body", lg: "h-13 px-8 text-body-lg" } as const;

type Base = { variant?: keyof typeof variants; size?: keyof typeof sizes; loading?: boolean; full?: boolean };

export const buttonClass = ({ variant = "primary", size = "md", full }: Base = {}) =>
  clsx(
    "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-40",
    variants[variant], sizes[size], full && "w-full",
  );

export function Button({ variant, size, loading, full, className, children, disabled, ...rest }: Base & ComponentProps<"button">) {
  return (
    <button className={clsx(buttonClass({ variant, size, full }), className)} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, full, className, ...rest }: Base & ComponentProps<typeof Link>) {
  return <Link className={clsx(buttonClass({ variant, size, full }), className)} {...rest} />;
}
