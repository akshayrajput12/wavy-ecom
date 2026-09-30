import type { Metadata } from "next";
import { ReturnSuccessView } from "@/views/returns/ReturnSuccessView";

export const metadata: Metadata = { title: "Return requested" };

export default async function ReturnSuccessPage({ params, searchParams }: {
  params: Promise<{ ref: string }>; searchParams: Promise<{ order?: string }>;
}) {
  const [{ ref }, { order }] = await Promise.all([params, searchParams]);
  return <ReturnSuccessView reference={decodeURIComponent(ref)} orderNumber={order} />;
}
