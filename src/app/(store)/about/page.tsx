import type { Metadata } from "next";
import { about } from "@/data/content";
import { AboutView } from "@/views/content/AboutView";

export const metadata: Metadata = { title: about.overline, description: about.intro };

export default function AboutRoute() {
  return <AboutView />;
}
