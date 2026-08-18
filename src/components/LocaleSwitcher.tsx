'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { Locale } from '@/lib/i18n/dictionaries';

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  const locales: Array<{ code: Locale; label: string }> = [
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
      {locales.map((item) => (
        <button
          key={item.code}
          onClick={() => setLocale(item.code)}
          className={`px-2.5 py-1 rounded-lg font-bold transition ${
            locale === item.code
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
