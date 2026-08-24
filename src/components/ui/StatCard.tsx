import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  badge,
  className = '',
}: StatCardProps) {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-bold flex items-center gap-0.5 ${
                  trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${trend.isPositive ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-muted leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-surface-overlay border border-border-default flex items-center justify-center text-text-muted shadow-sm">
              {icon}
            </div>
          )}
          {badge && <div>{badge}</div>}
        </div>
      </div>
    </Card>
  );
}
