'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Lang } from '@/data/content';

/* ──────────────────────────────────────
   Context type
────────────────────────────────────── */
interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
  /** Convenience: pick the right string from a bilingual object */
  t: (obj: Readonly<{ zh: string; en: string }>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'zh',
  toggle: () => {},
  t: (obj) => obj.zh,
});

/* ──────────────────────────────────────
   Provider
────────────────────────────────────── */
const STORAGE_KEY = '8688-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh');

  /* Restore persisted preference on mount */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'zh') setLang(stored);
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback(
    (obj: Readonly<{ zh: string; en: string }>) => obj[lang],
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ──────────────────────────────────────
   Hook
────────────────────────────────────── */
export function useLang() {
  return useContext(LanguageContext);
}
