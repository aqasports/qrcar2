import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'glass';
}

export function Card({
  children,
  className = '',
  variant = 'default',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200 overflow-hidden relative';

  const variantStyles = {
    default: 'linear-card',
    interactive: 'linear-card-interactive cursor-pointer group',
    glass: 'bg-surface-raised/60 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40',
  }[variant];

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 sm:px-6 sm:py-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm sm:text-base font-bold text-text-primary tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[11px] sm:text-xs text-text-secondary mt-0.5 leading-relaxed font-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3.5 sm:px-6 sm:py-4 border-t border-border-subtle bg-surface-base/40 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
