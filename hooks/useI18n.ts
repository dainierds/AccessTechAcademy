"use client";

import { useCallback, useEffect, useState } from 'react';
import { Language, translations } from '@/lib/i18n';

const COOKIE_NAME = 'app_lang';

function readStoredLang(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(COOKIE_NAME);
  return saved === 'es' || saved === 'en' ? saved : 'en';
}

export function useI18n() {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    setLang(readStoredLang());

    const handle = () => setLang(readStoredLang());
    window.addEventListener('languageChange', handle);
    return () => window.removeEventListener('languageChange', handle);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLang(next);
    localStorage.setItem(COOKIE_NAME, next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event('languageChange'));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === 'en' ? 'es' : 'en');
  }, [lang, setLanguage]);

  return { lang, t: translations[lang], setLanguage, toggleLanguage };
}
