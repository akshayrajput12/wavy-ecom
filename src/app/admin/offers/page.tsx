import { getCollections, getOffers } from "@/backend/admin/repo";
import { OffersView } from "@/views/admin/offers/View";

export const metadata = { title: "Offers" };

export default async function Page() {
  const [offers, collections] = await Promise.all([getOffers(), getCollections()]);
  return <OffersView offers={offers} collections={collections} />;
}
