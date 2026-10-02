import { getSession } from "@/backend/_core/auth";
import { getAccountUser, listAddresses } from "@/backend/account/repo";
import { getStoreSettings, listPaymentOptions } from "@/backend/settings/repo";
import { CheckoutView } from "@/views/checkout/CheckoutView";

export default async function CheckoutPage() {
  // one parallel wave: profile and address book no longer wait for each other
  const [user, savedAddresses, paymentOptions, settings] = await Promise.all([
    getAccountUser(),
    getSession().then((session) => (session ? listAddresses(session).catch(() => []) : [])),
    listPaymentOptions(),
    getStoreSettings(),
  ]);
  return <CheckoutView user={user} savedAddresses={savedAddresses} paymentOptions={paymentOptions} settings={settings} />;
}
