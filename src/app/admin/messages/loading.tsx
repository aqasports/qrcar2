import { Skeleton } from '@/components/ui';

export default function MessagesLoading() {
  return (
    <div className="h-[calc(100vh-140px)] flex rounded-2xl border border-border-subtle overflow-hidden bg-surface-raised font-sans">
      {/* Conversations List Skeleton */}
      <div className="w-80 border-r border-border-subtle p-4 space-y-4">
        <Skeleton variant="text" width={140} height={20} />
        <Skeleton variant="rectangular" height={36} />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton variant="circular" width={36} height={36} />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="text" width={140} height={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Conversation Skeleton */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
          <Skeleton variant="text" width={180} height={20} />
          <Skeleton variant="text" width={80} height={16} />
        </div>
        <div className="space-y-4 py-8">
          <Skeleton variant="rectangular" width={220} height={48} className="rounded-2xl" />
          <Skeleton variant="rectangular" width={280} height={60} className="ml-auto rounded-2xl" />
          <Skeleton variant="rectangular" width={200} height={40} className="rounded-2xl" />
        </div>
        <Skeleton variant="rectangular" height={44} className="rounded-xl" />
      </div>
    </div>
  );
}
