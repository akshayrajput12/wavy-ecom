"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Offsets store pages below the fixed header (--header-h) on every route except home, where the
 * hero sits flush under the overlaying pill. The announcement (a server node) follows the same rule.
 */
export function StoreMain({ announcement, children }: { announcement?: ReactNode; children: ReactNode }) {
  const home = usePathname() === "/";
  if (home) return <main id="main" className="flex-1">{children}</main>;
  return (
    <div className="flex flex-1 flex-col pt-(--header-h)">
      {announcement}
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
}
