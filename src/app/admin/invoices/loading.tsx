import { Skeleton, SkeletonTable } from '@/components/ui';

export default function InvoicesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="space-y-2 pb-6 border-b border-border-subtle">
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="text" width={340} height={16} />
      </div>

      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={140} height={36} />
        <Skeleton variant="rectangular" width={110} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>

      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
