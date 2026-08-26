import { Skeleton, SkeletonTable } from '@/components/ui';

export default function InventoryLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={320} height={16} />
        </div>
        <Skeleton variant="rectangular" width={160} height={36} />
      </div>

      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={140} height={36} />
        <Skeleton variant="rectangular" width={200} height={36} />
      </div>

      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
