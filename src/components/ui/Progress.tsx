import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  striped?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  striped = false,
  className = '',
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const variantColors = {
    primary: 'bg-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]',
    success: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    warning: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    danger: 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    info: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
  }[variant];

  return (
    <div className={`w-full space-y-1.5 ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-text-muted">{value} / {max}</span>
          <span className="font-bold text-text-primary">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-base border border-border-subtle rounded-full overflow-hidden ${sizeClasses}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${variantColors} ${
            striped ? 'bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[move-bg_2s_linear_infinite]' : ''
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
