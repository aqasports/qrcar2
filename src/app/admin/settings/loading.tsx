import { Skeleton } from '@/components/ui';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans">
      <div className="space-y-2 pb-6 border-b border-border-subtle">
        <Skeleton variant="text" width={220} height={28} />
        <Skeleton variant="text" width={340} height={16} />
      </div>

      <div className="p-6 rounded-2xl border border-border-subtle bg-surface-raised space-y-6">
        <Skeleton variant="text" width={180} height={20} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton variant="rectangular" height={42} />
          <Skeleton variant="rectangular" height={42} />
          <Skeleton variant="rectangular" height={42} />
          <Skeleton variant="rectangular" height={42} />
        </div>
        <Skeleton variant="rectangular" height={80} />
      </div>
    </div>
  );
}
