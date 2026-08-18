'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, Dictionary, dictionaries } from './dictionaries';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: dictionaries.fr,
  dir: 'ltr',
});

export function I18nProvider({
  children,
  initialLocale = 'fr',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check saved user preference in localStorage if present
    const saved = localStorage.getItem('garage_pro_locale') as Locale | null;
    if (saved && (saved === 'fr' || saved === 'ar' || saved === 'en')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('garage_pro_locale', newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const t = dictionaries[locale] || dictionaries.fr;
  const dir = t.dir;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      <div dir={dir} className={dir === 'rtl' ? 'font-sans text-right' : 'font-sans text-left'}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
