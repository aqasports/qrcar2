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
    'inline-flex items-center font-semibold tracking-wider rounded-full uppercase transition-all select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1.5 leading-none',
    md: 'text-[11px] px-3 py-1 gap-2',
  }[size];

  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]',
    warning: 'bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-[inset_0_1px_0_rgba(245,158,11,0.15)]',
    danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/25 shadow-[inset_0_1px_0_rgba(244,63,94,0.15)]',
    info: 'bg-blue-500/10 text-blue-300 border border-blue-500/25 shadow-[inset_0_1px_0_rgba(59,130,246,0.15)]',
    neutral: 'bg-white/[0.04] text-text-secondary border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  }[variant];

  const dotColors = {
    success: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
    warning: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
    danger: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]',
    info: 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]',
    neutral: 'bg-slate-400',
  }[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {pulse ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors}`}
          />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors}`} />
        </span>
      ) : (
        <span className={`inline-flex rounded-full h-1.5 w-1.5 ${dotColors}`} />
      )}
      <span>{children}</span>
    </span>
  );
}
