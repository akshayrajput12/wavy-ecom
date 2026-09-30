import { getHomeSections } from "@/backend/content/home";
import { HomeView } from "@/views/home/HomeView";

export default async function HomePage() {
  return <HomeView sections={await getHomeSections()} />;
}
