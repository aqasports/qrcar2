import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number | React.ReactNode;
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
    <Card className={`p-5 sm:p-6 relative overflow-hidden group ${className}`}>
      {/* Subtle top ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-300" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black font-mono text-text-primary tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_1px_0_rgba(16,185,129,0.1)]'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[inset_0_1px_0_rgba(244,63,94,0.1)]'
                }`}
              >
                <svg
                  className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
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
            <p className="text-[11px] text-text-secondary leading-relaxed font-normal">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-surface-overlay/80 border border-white/[0.08] flex items-center justify-center text-text-secondary shadow-inner group-hover:text-accent group-hover:border-accent/40 transition-colors">
              {icon}
            </div>
          )}
          {badge && <div>{badge}</div>}
        </div>
      </div>

      {/* Mini Telemetry Sparkline Accent Bar */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-1.5">
        <div className="h-1 flex-1 rounded-full bg-blue-500/20 overflow-hidden">
          <div className="h-full bg-accent rounded-full w-3/4 group-hover:w-full transition-all duration-500" />
        </div>
        <span className="text-[9px] font-mono text-text-muted uppercase">Live</span>
      </div>
    </Card>
  );
}
