import { listReturns } from "@/backend/admin/repo";
import { ReturnListQuery } from "@/backend/admin/schemas/ops";
import { parseListQuery } from "@/views/admin/orders/components/query";
import { ReturnsView } from "@/views/admin/returns/View";

export const metadata = { title: "Returns" };

export default async function Page({ searchParams }: PageProps<"/admin/returns">) {
  return <ReturnsView returns={await listReturns(parseListQuery(ReturnListQuery, await searchParams))} />;
}
