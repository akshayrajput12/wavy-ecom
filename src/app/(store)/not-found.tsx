import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { pageStates } from "@/data/content";
import { mainNav } from "@/data/navigation";

export default function NotFound() {
  const c = pageStates.notFound;
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-20 text-center">
      <div>
        <p className="font-serif text-[clamp(6rem,20vw,14rem)] leading-none text-accent-deep">404</p>
        <h1 className="t-display mt-2">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-body-lg text-ink-soft">{c.body}</p>
        <ButtonLink href="/" className="mt-8">{c.cta}</ButtonLink>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {mainNav.map((n) => <li key={n.href}><Link href={n.href} className="text-body underline-offset-4 hover:underline">{n.label}</Link></li>)}
        </ul>
      </div>
    </div>
  );
}
