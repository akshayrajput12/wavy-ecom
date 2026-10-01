import { PageHeader } from "@/components/admin/Panel";
import { EmptyState } from "@/components/ui/States";
import { RETURN_STATUS } from "@/types/domain";
import type { AdminReturn, Paginated } from "@/types/admin";
import { FilterBar, Pager } from "../orders/components/list";
import { opts } from "../orders/components/table";
import { ReturnCard } from "./components/ReturnCard";

export function ReturnsView({ returns }: { returns: Paginated<AdminReturn> }) {
  return (
    <>
      <PageHeader title="Returns" description="Approve or reject requests, schedule pickup, receive items and close. Refunds are created from the order page." />
      <FilterBar filters={[{ key: "q", label: "RMA number" }, { key: "status", label: "Status", options: opts(RETURN_STATUS) }]} />
      {returns.items.length === 0 ? <EmptyState title="No returns match" /> : (
        <ul className="flex flex-col gap-4">{returns.items.map((r) => <li key={r.id}><ReturnCard ret={r} /></li>)}</ul>
      )}
      <Pager page={returns.page} pageSize={returns.pageSize} total={returns.total} />
    </>
  );
}
