import Link from "next/link";
import { getNavigation } from "@/backend/content/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { footerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import { NewsletterForm } from "./NewsletterForm";

const MAX_LINKS = 8;

/** Server component: groups from DB categories/collections/content pages, contacts from settings. */
export async function Footer() {
  const [settings, { categories, collections, pages }] = await Promise.all([getStoreSettings(), getNavigation()]);
  const storeName = settings?.storeName ?? layoutCopy.storeFallback;
  const groups = [
    { title: footerCopy.shop, links: categories.slice(0, MAX_LINKS) },
    { title: footerCopy.collections, links: collections.slice(0, MAX_LINKS) },
    { title: footerCopy.help, links: [{ label: footerCopy.faq, href: "/faq" }, { label: footerCopy.account, href: "/account" }] },
    { title: footerCopy.company, links: [{ label: footerCopy.blog, href: "/blog" }, ...pages.filter((p) => p.href !== "/faq")] },
  ].filter((g) => g.links.length);

  return (
    <footer className="mt-auto bg-black text-on-dark">
      <div className="container-x grid gap-12 pb-10 pt-16 lg:grid-cols-12 lg:pt-20">
        <div className="lg:col-span-4">
          <p className="font-serif text-display leading-none">{storeName}</p>
          <NewsletterForm tone="dark" />
          {(settings?.supportEmail || settings?.supportPhone) && (
            <div className="mt-8 text-meta text-on-dark/70">
              <p className="t-overline text-on-dark/50">{layoutCopy.support}</p>
              {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="mt-2 block text-body text-on-dark/85 hover:text-on-dark">{settings.supportEmail}</a>}
              {settings.supportPhone && <a href={`tel:${settings.supportPhone}`} className="mt-1 block text-body text-on-dark/85 hover:text-on-dark">{settings.supportPhone}</a>}
            </div>
          )}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-7 lg:col-start-6">
          {groups.map((g) => (
            <div key={g.title}>
              <h2 className="t-overline text-on-dark/50">{g.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="text-body text-on-dark/85 transition-colors hover:text-on-dark">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-x border-t border-on-dark/10 py-6 text-meta text-on-dark/60">
        <p>{layoutCopy.rights(new Date().getFullYear(), storeName)}</p>
      </div>
    </footer>
  );
}
