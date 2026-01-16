import { Skeleton } from "@/components/ui";

export default function RoundPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button skeleton */}
        <Skeleton className="h-6 w-16 mb-6" />

        {/* Round Image Card skeleton */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <Skeleton className="h-64 sm:h-80 w-full rounded-none" />
          <div className="p-4 border-t flex justify-between items-center">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        {/* Caption Input skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Captions list skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
