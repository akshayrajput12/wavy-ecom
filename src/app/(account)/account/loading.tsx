import { Skeleton } from "@/components/ui/States";
import { pageStates } from "@/data/copy";

export default function AccountLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label={pageStates.loading}>
      <Skeleton className="h-3 w-24 rounded-pill" />
      <Skeleton className="h-12 w-1/2 rounded-md" />
      <Skeleton className="mt-4 h-24 rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}
