import { Skeleton } from "@/components/ui/States";

export default function AccountLoading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}
