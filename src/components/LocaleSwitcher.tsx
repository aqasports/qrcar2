'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { Locale } from '@/lib/i18n/dictionaries';

export default function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  const locales: Array<{ code: Locale; label: string; short: string }> = [
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'ar', label: 'العربية', short: 'عر' },
    { code: 'en', label: 'English', short: 'EN' },
  ];

  return (
    <div
      role="group"
      aria-label="Sélection de la langue"
      className={`inline-flex items-center bg-surface-raised border border-border-default rounded-xl p-0.5 text-xs shadow-inner ${className}`}
    >
      {locales.map((item) => {
        const isActive = locale === item.code;
        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLocale(item.code)}
            title={item.label}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-tight transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-accent text-white shadow-sm shadow-blue-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
            }`}
          >
            {item.code === 'ar' ? 'العربية' : item.short}
          </button>
        );
      })}
    </div>
  );
}
