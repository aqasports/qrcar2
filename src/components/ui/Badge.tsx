import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function Badge({
  children,
  className = '',
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-bold tracking-tight rounded-lg uppercase transition-colors select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 leading-none',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    neutral: 'bg-slate-800 text-text-secondary border border-border-default',
  }[variant];

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    neutral: 'bg-slate-400',
  }[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors}`}
          />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
