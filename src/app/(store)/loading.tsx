import { Skeleton } from "@/components/ui/States";

export default function Loading() {
  return (
    <div className="container-x pb-24" aria-busy="true" aria-label="Loading">
      <div className="border-b border-line py-10 lg:py-16">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-5 h-14 w-2/3 max-w-xl" />
        <Skeleton className="mt-4 h-4 w-1/2 max-w-md" />
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <Skeleton className="aspect-[4/5] w-full rounded-md" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
