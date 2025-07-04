'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';

const translations = {
  es: esTranslations,
  en: enTranslations,
};

type Locale = keyof typeof translations;
type Replacements = Record<string, string | number>;

type I18nContextType = {
  t: (key: string, replacements?: Replacements) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as Locale;
    if (storedLocale && translations[storedLocale]) {
      setLocaleState(storedLocale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, replacements?: Replacements): string => {
    const keys = key.split('.');
    let result: any = translations[locale];
    let found = true;

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        found = false;
        break;
      }
    }

    if (!found) {
        let fallbackResult: any = translations.es;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
             if (fallbackResult === undefined) {
                 console.warn(`Translation key not found in fallback: ${key}`);
                 return key;
             }
        }
        result = fallbackResult;
    }
    
    if (typeof result === 'string' && replacements) {
        return Object.entries(replacements).reduce((acc, [k, v]) => {
            return acc.replace(`{${k}}`, String(v));
        }, result);
    }

    return result || key;
  }, [locale]);
  
  const value = useMemo(() => ({ t, locale, setLocale }), [t, locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
