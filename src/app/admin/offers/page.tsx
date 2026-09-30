import { listOffers } from "@/backend/admin/repo";
import { OffersView } from "@/views/admin/offers/View";

export const metadata = { title: "Offers" };

export default async function Page() {
  return <OffersView offers={await listOffers()} />;
}
