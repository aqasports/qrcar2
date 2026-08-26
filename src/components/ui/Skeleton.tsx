import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded-md w-full',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl border border-border-subtle p-6 space-y-4',
  }[variant];

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  if (variant === 'card') {
    return (
      <div
        className={`bg-surface-raised/40 relative overflow-hidden animate-pulse ${variantClasses} ${className}`}
        style={inlineStyles}
        aria-busy="true"
        aria-label="Chargement du contenu"
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 bg-surface-overlay rounded-md w-1/3" />
          <div className="h-8 w-8 bg-surface-overlay rounded-xl" />
        </div>
        <div className="h-8 bg-surface-overlay rounded-md w-1/2" />
        <div className="h-3 bg-surface-overlay rounded-md w-3/4" />
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-overlay/60 relative overflow-hidden animate-pulse ${variantClasses} ${className}`}
      style={inlineStyles}
      aria-busy="true"
      aria-label="Chargement..."
      {...props}
    />
  );
}

export function SkeletonGrid({ count = 4, className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised overflow-hidden">
      <div className="p-4 border-b border-border-subtle flex gap-4 bg-surface-base/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} variant="text" className={`h-4 flex-1 ${c === 0 ? 'w-1/4' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
