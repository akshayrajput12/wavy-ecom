import { getAccountUser, getAddresses } from "@/backend/orders/repo";
import { hasSupabase } from "@/lib/env";
import { CheckoutView } from "@/views/checkout/CheckoutView";

export default async function CheckoutPage() {
  // ponytail: demo mode checks out as a guest (the primary flow); saved addresses appear with real auth
  const user = hasSupabase ? await getAccountUser() : null;
  const savedAddresses = user ? await getAddresses(user.id) : [];
  return <CheckoutView user={user} savedAddresses={savedAddresses} />;
}
