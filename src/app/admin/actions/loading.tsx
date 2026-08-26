import { Skeleton, SkeletonTable } from '@/components/ui';

export default function ActionsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={340} height={16} />
        </div>
        <Skeleton variant="rectangular" width={180} height={36} />
      </div>

      {/* Quick Launchers Skeleton */}
      <div className="p-4 rounded-2xl border border-border-subtle bg-surface-raised space-y-3">
        <Skeleton variant="text" width={180} height={14} />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={50} />
          ))}
        </div>
      </div>

      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
