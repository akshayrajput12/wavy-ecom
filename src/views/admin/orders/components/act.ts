"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mutate, type AdminApiResult, type HttpMethod } from "../../api";

/** Run a mutation with toasts, then refresh the server data on success. */
export function useAct() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async <T = unknown>(method: Exclude<HttpMethod, "GET">, path: string, body: unknown, success: string): Promise<AdminApiResult<T>> => {
    setBusy(true);
    const res = await mutate<T>(method, path, body, { success });
    setBusy(false);
    if (res.ok) router.refresh();
    return res;
  };
  return { busy, run };
}
