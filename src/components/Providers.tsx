'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/lib/hooks/useToast';
import { I18nProvider } from '@/lib/i18n/I18nProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
