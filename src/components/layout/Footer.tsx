import Link from "next/link";
import { getNavigation } from "@/backend/content/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { footerCopy, headerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import { BackToTop } from "./BackToTop";
import { FooterWordmark } from "./FooterWordmark";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const MAX_LINKS = 6;
const link = "inline-flex min-h-11 items-center text-meta text-ink-soft transition-colors hover:text-ink lg:min-h-8";

/**
 * Paper footer: logo + newsletter, 3 link columns (DB categories/pages) fading up, legal + contact + back-to-top row,
 * and the giant store-name wordmark that reveals letter by letter as it scrolls in (FooterWordmark).
 */
export async function Footer() {
  const [settings, { categories, collections, pages }] = await Promise.all([getStoreSettings(), getNavigation()]);
  const storeName = settings?.storeName ?? layoutCopy.storeFallback;
  const groups = [
    {
      title: footerCopy.shop,
      links: [...categories.slice(0, MAX_LINKS), ...(collections.length ? [{ label: headerCopy.collections, href: "/collections" }] : [])],
    },
    {
      title: footerCopy.help,
      links: [{ label: footerCopy.faq, href: "/faq" }, { label: footerCopy.track, href: "/track" }, { label: footerCopy.account, href: "/account" }],
    },
    { title: footerCopy.company, links: [{ label: footerCopy.blog, href: "/blog" }, ...pages.filter((p) => p.href !== "/faq").slice(0, MAX_LINKS)] },
  ].filter((g) => g.links.length);
  const contacts = [
    settings?.supportEmail && { label: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
    settings?.supportPhone && { label: settings.supportPhone, href: `tel:${settings.supportPhone}` },
  ].filter((c): c is { label: string; href: string } => Boolean(c));

  return (
    <footer className="mt-auto border-t border-line-soft bg-canvas text-ink">
      <div className="container-x grid gap-12 pb-12 pt-16 lg:grid-cols-12 lg:pt-20">
        <Reveal className="lg:col-span-4">
          <Logo storeName={storeName} logoUrl={settings?.logoUrl} size="footer" />
          <p className="mt-4 max-w-xs text-meta text-ink-soft">{footerCopy.newsletterTitle}</p>
          <NewsletterForm />
        </Reveal>
        <nav aria-label={footerCopy.nav} className="lg:col-span-7 lg:col-start-6">
          <Stagger gap={0.08} className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((g) => (
              <StaggerItem key={g.title}>
                <h2 className="t-overline">{g.title}</h2>
                <ul className="mt-3">
                  {g.links.map((l) => <li key={l.href}><Link href={l.href} className={link}><span className="link-sweep">{l.label}</span></Link></li>)}
                </ul>
              </StaggerItem>
            ))}
          </Stagger>
        </nav>
      </div>

      <div className="container-x">
        <div className="flex flex-col gap-2 border-t border-line py-6 text-micro text-ink-soft sm:flex-row sm:items-center sm:gap-6">
          <p className="sm:mr-auto">{layoutCopy.rights(new Date().getFullYear(), storeName)}</p>
          {contacts.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="sr-only">{layoutCopy.support}</span>
              {contacts.map((c, i) => (
                <span key={c.href} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden>·</span>}
                  <a href={c.href} className="inline-flex min-h-11 items-center hover:text-ink"><span className="link-sweep">{c.label}</span></a>
                </span>
              ))}
            </p>
          )}
          <div className="mt-2 sm:mt-0"><BackToTop /></div>
        </div>
      </div>

      <FooterWordmark name={storeName} />
    </footer>
  );
}
