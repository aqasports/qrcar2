import { Skeleton, SkeletonGrid } from '@/components/ui';

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={240} height={28} />
          <Skeleton variant="text" width={340} height={16} />
        </div>
        <Skeleton variant="rectangular" width={160} height={36} />
      </div>

      <SkeletonGrid count={6} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" />
    </div>
  );
}
