import { Skeleton, SkeletonGrid, SkeletonTable } from '@/components/ui';

export default function AdminLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={320} height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={110} height={36} />
          <Skeleton variant="rectangular" width={160} height={36} />
        </div>
      </div>

      {/* 4 StatCards Skeleton */}
      <SkeletonGrid count={4} />

      {/* Pipeline Strip Skeleton */}
      <div className="p-6 rounded-2xl border border-border-subtle bg-surface-raised space-y-4">
        <div className="flex justify-between">
          <Skeleton variant="text" width={200} height={20} />
          <Skeleton variant="text" width={100} height={16} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-base/50 border border-border-subtle space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" width={70} height={14} />
                <Skeleton variant="text" width={24} height={14} />
              </div>
              <Skeleton variant="rectangular" height={6} />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width={240} height={22} />
          <Skeleton variant="rectangular" width={120} height={32} />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    </div>
  );
}
