import { announcements } from "@/data/navigation";

/** Thin scrolling strip above the header. CSS-only marquee; static for reduced-motion users (global rule). */
export function AnnouncementBar() {
  const items = [...announcements, ...announcements];
  return (
    <div className="overflow-hidden bg-black py-2 text-micro font-medium tracking-wide text-on-dark">
      <p className="sr-only">{announcements.join(". ")}</p>
      <div aria-hidden className="flex w-max animate-[marquee_40s_linear_infinite] gap-12 whitespace-nowrap motion-reduce:animate-none">
        {[...items, ...items].map((a, i) => (
          <span key={i} className="flex items-center gap-12">{a}<span className="text-accent">✦</span></span>
        ))}
      </div>
      <style>{`@keyframes marquee { to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
