type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function SkeletonText({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={
            i === 0
              ? "h-4 w-2/3"
              : i === lines - 1
                ? "h-3 w-1/2"
                : "h-3 w-full"
          }
        />
      ))}
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat daftar">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5 rounded-md" />
              <Skeleton className="h-3 w-3/5 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl bg-gray-200/80" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-50/60"
      aria-busy="true"
      aria-label="Memuat halaman">
      {/* TopNavbar skeleton */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-2.5 w-32 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
        {/* Header card */}
        <div className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-xs">
          <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-52 rounded-md" />
          </div>
          <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-100 p-1">
          <Skeleton className="h-10 rounded-xl bg-white" />
          <Skeleton className="h-10 rounded-xl bg-gray-200/70" />
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <CardListSkeleton count={2} />
        </div>
      </div>
    </div>
  );
}
