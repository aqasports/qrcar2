import { Skeleton, SkeletonGrid } from '@/components/ui';

export default function BillingLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <div className="space-y-2 pb-6 border-b border-border-subtle">
        <Skeleton variant="text" width={240} height={28} />
        <Skeleton variant="text" width={380} height={16} />
      </div>

      <SkeletonGrid count={3} className="grid grid-cols-1 md:grid-cols-3 gap-6" />
    </div>
  );
}
