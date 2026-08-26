import { Skeleton, SkeletonTable } from '@/components/ui';

export default function ClientsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="text" width={280} height={16} />
        </div>
        <Skeleton variant="rectangular" width={130} height={36} />
      </div>

      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
