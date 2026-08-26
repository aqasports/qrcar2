'use client';

import React, { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, title, message, variant = 'info', durationMs = 4000 } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (durationMs <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [id, durationMs, onDismiss]);

  const variantStyles = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-surface-raised/95',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      bar: 'bg-emerald-500',
    },
    error: {
      border: 'border-rose-500/30',
      bg: 'bg-surface-raised/95',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      bar: 'bg-rose-500',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-surface-raised/95',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      bar: 'bg-amber-500',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-surface-raised/95',
      icon: (
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-accent flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      bar: 'bg-accent',
    },
  }[variant];

  return (
    <div
      role="alert"
      className={`w-full max-w-sm sm:max-w-md ${variantStyles.bg} border ${variantStyles.border} rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200`}
    >
      <div className="p-3 sm:p-4 flex items-start gap-3">
        {variantStyles.icon}
        <div className="flex-1 min-w-0 pt-0.5 space-y-0.5">
          {title && (
            <h5 className="text-xs font-bold text-text-primary tracking-tight">{title}</h5>
          )}
          <p className="text-xs text-text-secondary leading-relaxed font-medium">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
          title="Fermer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      {durationMs > 0 && (
        <div className="h-0.5 w-full bg-surface-base">
          <div
            className={`h-full ${variantStyles.bar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto max-w-full"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
