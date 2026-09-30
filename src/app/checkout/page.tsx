import { getSession } from "@/backend/_core/auth";
import { getAccountUser, listAddresses } from "@/backend/account/repo";
import { getStoreSettings, listPaymentOptions } from "@/backend/settings/repo";
import { CheckoutView } from "@/views/checkout/CheckoutView";

export default async function CheckoutPage() {
  const [session, user, paymentOptions, settings] = await Promise.all([getSession(), getAccountUser(), listPaymentOptions(), getStoreSettings()]);
  const savedAddresses = session ? await listAddresses(session).catch(() => []) : [];
  return <CheckoutView user={user} savedAddresses={savedAddresses} paymentOptions={paymentOptions} settings={settings} />;
}
