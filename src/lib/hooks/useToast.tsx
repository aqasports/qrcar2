'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastMessage, ToastVariant } from '@/components/ui/Toast';

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string, durationMs?: number) => void;
    error: (message: string, title?: string, durationMs?: number) => void;
    warning: (message: string, title?: string, durationMs?: number) => void;
    info: (message: string, title?: string, durationMs?: number) => void;
    custom: (options: Omit<ToastMessage, 'id'>) => void;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((variant: ToastVariant, message: string, title?: string, durationMs = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, variant, message, title, durationMs }]);
  }, []);

  const custom = useCallback((options: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toastMethods = {
    success: (message: string, title?: string, durationMs?: number) =>
      addToast('success', message, title, durationMs),
    error: (message: string, title?: string, durationMs?: number) =>
      addToast('error', message, title, durationMs),
    warning: (message: string, title?: string, durationMs?: number) =>
      addToast('warning', message, title, durationMs),
    info: (message: string, title?: string, durationMs?: number) =>
      addToast('info', message, title, durationMs),
    custom,
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
