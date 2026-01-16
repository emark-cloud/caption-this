import { Skeleton } from "@/components/ui";

export default function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2"
        >
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
