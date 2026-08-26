import { Skeleton, SkeletonGrid, SkeletonTable } from '@/components/ui';

export default function CardsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={320} height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={140} height={36} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </div>
      </div>

      <SkeletonGrid count={3} className="grid grid-cols-1 sm:grid-cols-3 gap-4" />

      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
