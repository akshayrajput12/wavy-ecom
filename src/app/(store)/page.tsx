import { getHomeSections } from "@/backend/content/home";
import { listFaqs } from "@/backend/content/repo";
import { HomeView } from "@/views/home/HomeView";

const HOME_FAQS = 5;

export default async function HomePage() {
  const [sections, faqs] = await Promise.all([getHomeSections(), listFaqs()]);
  return <HomeView sections={sections} faqs={faqs.slice(0, HOME_FAQS)} />;
}
