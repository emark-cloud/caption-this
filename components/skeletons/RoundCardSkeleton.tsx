import { Skeleton } from "@/components/ui";

export default function RoundCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Image area */}
      <div className="relative h-40 w-full">
        <Skeleton className="h-full w-full rounded-none" />
        {/* Status badge skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* Content area */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
    </div>
  );
}
