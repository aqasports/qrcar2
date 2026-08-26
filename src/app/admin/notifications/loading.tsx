import { Skeleton, SkeletonTable } from '@/components/ui';

export default function NotificationsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <div className="space-y-2 pb-6 border-b border-border-subtle">
        <Skeleton variant="text" width={240} height={28} />
        <Skeleton variant="text" width={360} height={16} />
      </div>

      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
