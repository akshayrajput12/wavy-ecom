"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { home } from "@/data/home";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const h = home.hero;
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // A restrained editorial expansion: the image frame breathes wider as the
  // shopper leaves the hero, then hands off cleanly to the product rail below.
  // Start as a softly framed editorial plate, then let it open toward the
  // edges as the shopper scrolls. Keep the range short so the next section
  // arrives naturally and the page never feels pinned for too long.
  const imageScale = useTransform(scrollYProgress, [0, 0.72], [0.96, reduce ? 0.96 : 1.06]);
  const imageRadius = useTransform(scrollYProgress, [0, 0.72], [20, reduce ? 20 : 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.72], [0, reduce ? 0 : -34]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65, 0.9], reduce ? [1, 1, 1] : [1, 1, 0]);
  const words = h.title.split(" ");

  return (
    <section ref={sectionRef} aria-label="Featured collection" className="relative -mt-[var(--header-h)] h-[138svh] min-h-[760px] bg-black text-on-dark">
      <div className="sticky top-0 h-svh min-h-[620px] overflow-hidden">
      <motion.div
        style={{ scale: imageScale, borderRadius: imageRadius }}
          className="absolute inset-3 overflow-hidden sm:inset-5 lg:inset-7"
          initial={reduce ? false : { opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease }}
        >
          <Image src={h.image.url} alt={h.image.alt} fill priority sizes="100vw" className="object-cover object-[50%_30%]" />
      </motion.div>
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-black/30" aria-hidden />

      <motion.div className="container-x absolute inset-x-0 bottom-0 grid gap-7 pb-8 pt-28 sm:gap-10 sm:pb-12 lg:grid-cols-12 lg:pb-16" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="lg:col-span-8">
          <motion.p className="t-overline text-on-dark/80" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
            {h.overline}
          </motion.p>
          <h1 className="t-hero mt-5 max-w-[14ch] text-balance">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span className="inline-block" initial={reduce ? false : { y: "105%" }} animate={{ y: 0 }} transition={{ delay: 0.35 + i * 0.06, duration: 1, ease }}>
                  {w}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>
        </div>
        <motion.div
          className="flex flex-col gap-6 lg:col-span-4 lg:items-end lg:justify-end lg:text-right"
          initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.9, ease }}
        >
          <p className="max-w-sm text-body-lg text-on-dark/85">{h.body}</p>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href={h.primary.href} variant="accent" size="lg">{h.primary.label}</ButtonLink>
            <Link href={h.secondary.href} className="inline-flex h-13 items-center rounded-pill border border-on-dark/60 px-8 text-body-lg font-medium transition-colors hover:bg-on-dark hover:text-ink">{h.secondary.label}</Link>
          </div>
          <p className="flex items-center gap-2 text-micro text-on-dark/60">
            <ArrowDownRight className="size-3.5" aria-hidden /> {h.caption}
          </p>
        </motion.div>
      </motion.div>
      </div>
    </section>
  );
}
