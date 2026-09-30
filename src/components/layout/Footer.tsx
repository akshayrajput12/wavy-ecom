import Link from "next/link";
import { footerCopy, footerNav } from "@/data/navigation";
import { site } from "@/data/site";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="mt-auto bg-black text-on-dark">
      <div className="container-x grid gap-14 pb-10 pt-16 lg:grid-cols-12 lg:pt-24">
        <div className="lg:col-span-5">
          <h2 className="t-display max-w-md">{footerCopy.newsletterTitle}</h2>
          <p className="mt-4 max-w-sm text-body text-on-dark/70">{footerCopy.newsletterBody}</p>
          <NewsletterForm />
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {footerNav.map((g) => (
            <div key={g.title}>
              <h3 className="t-overline text-on-dark/50">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-body text-on-dark/85 hover:text-on-dark hover:underline hover:underline-offset-4">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-x flex flex-col gap-6 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-serif text-[clamp(5rem,18vw,16rem)] leading-[0.8] tracking-tight" aria-hidden>{site.name}</p>
        <div className="flex flex-col gap-3 text-meta text-on-dark/60 sm:items-end">
          <ul className="flex gap-5">
            {Object.entries(site.social).map(([name, href]) => (
              <li key={name}><a href={href} target="_blank" rel="noreferrer" className="capitalize text-on-dark/85 hover:text-on-dark">{name}</a></li>
            ))}
          </ul>
          <p>© {new Date().getFullYear()} {site.name}. {footerCopy.legal}</p>
        </div>
      </div>
    </footer>
  );
}
