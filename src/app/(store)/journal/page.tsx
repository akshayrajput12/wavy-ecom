import type { Metadata } from "next";
import { getBlogPosts } from "@/backend/content/repo";
import { journalCopy } from "@/data/content";
import { JournalView } from "@/views/journal/JournalView";

export const metadata: Metadata = { title: journalCopy.title, description: journalCopy.intro };

export default async function JournalRoute() {
  return <JournalView posts={await getBlogPosts()} />;
}
