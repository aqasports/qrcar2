import React from 'react';

export interface CurrencyDisplayProps {
  amount: number | string;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showZeroDecimals?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = 'DZD',
  className = '',
  size = 'md',
  showZeroDecimals = false,
}: CurrencyDisplayProps) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;

  const formattedAmount = numericAmount.toLocaleString('fr-DZ', {
    minimumFractionDigits: showZeroDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl sm:text-3xl font-black',
  }[size];

  return (
    <span className={`inline-flex items-baseline gap-1 font-mono tracking-tight text-text-primary ${sizeClasses} ${className}`}>
      <span>{formattedAmount}</span>
      <span className="text-[0.75em] font-sans font-bold uppercase tracking-wider text-text-muted">
        {currency}
      </span>
    </span>
  );
}
