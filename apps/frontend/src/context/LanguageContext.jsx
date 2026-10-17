import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { en } from '../translations/en';
import { es } from '../translations/es';

const LanguageContext = createContext(null);

const LANGUAGE_KEY = 'equiwage.language';
const DEFAULT_LANGUAGE = 'es';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    try {
      const saved = window.localStorage.getItem(LANGUAGE_KEY);
      return saved === 'en' || saved === 'es' ? saved : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
    } catch {
      // localStorage no disponible
    }
  }, [language]);

  const t = useCallback((key, params = {}) => {
    const translations = language === 'es' ? es : en;
    let text = translations[key] ?? en[key] ?? key;

    Object.keys(params).forEach((paramKey) => {
      text = String(text).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
    });

    return text;
  }, [language]);

  const tDept = useCallback((dept) => {
    if (!dept) return '';
    const key = `dept.${dept}`;
    const translations = language === 'es' ? es : en;
    return translations[key] ?? en[key] ?? dept;
  }, [language]);

  const tSource = useCallback((source) => {
    if (!source) return '';
    const key = `source.${source}`;
    const translations = language === 'es' ? es : en;
    return translations[key] ?? en[key] ?? source;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    tDept,
    tSource,
    translations: language === 'es' ? es : en,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}