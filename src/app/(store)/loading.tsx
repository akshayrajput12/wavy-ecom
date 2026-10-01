import { Skeleton } from "@/components/ui/States";
import { pageStates } from "@/data/copy";

export default function Loading() {
  return (
    <div className="container-x pb-24 pt-10" aria-busy="true" aria-label={pageStates.loading}>
      <div className="grid gap-4 border-b border-line py-10 lg:py-16">
        <Skeleton className="h-3 w-24 rounded-pill" />
        <Skeleton className="h-14 w-2/3 max-w-xl rounded-md" />
        <Skeleton className="h-14 w-1/2 max-w-md rounded-md" />
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4 rounded-pill" />
            <Skeleton className="mt-2 h-3 w-1/2 rounded-pill" />
          </li>
        ))}
      </ul>
    </div>
  );
}
