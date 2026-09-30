import { getSession } from "@/backend/_core/auth";
import { isStaffRole } from "@/backend/_core/permissions";
import { getNavigation } from "@/backend/content/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { layoutCopy } from "@/data/storefront";
import { HeaderBar } from "./HeaderBar";

/** Server wrapper: store name from settings, mega-menu from DB navigation. Usable in any layout without props. */
export async function Header() {
  const [settings, nav, session] = await Promise.all([getStoreSettings(), getNavigation(), getSession()]);
  return <HeaderBar storeName={settings?.storeName ?? layoutCopy.storeFallback} categories={nav.categories} collections={nav.collections} isStaff={isStaffRole(session?.role)} />;
}
