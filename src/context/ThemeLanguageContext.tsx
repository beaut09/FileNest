import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, ThemeMode } from '../types';
import { translations, TranslationDictionary } from '../i18n/translations';

interface ThemeLanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  t: TranslationDictionary;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('filenest_lang') as SupportedLanguage;
    return saved && translations[saved] ? saved : 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('filenest_theme') as ThemeMode;
    return saved || 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  // Sync language with HTML dir attribute (Arabic is RTL)
  useEffect(() => {
    localStorage.setItem('filenest_lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Sync theme with document classList
  useEffect(() => {
    localStorage.setItem('filenest_theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let dark = false;
      if (theme === 'dark') {
        dark = true;
      } else if (theme === 'light') {
        dark = false;
      } else {
        dark = mediaQuery.matches;
      }
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const setTheme = (thm: ThemeMode) => {
    setThemeState(thm);
  };

  const t = translations[language] || translations.en;

  return (
    <ThemeLanguageContext.Provider value={{ language, setLanguage, theme, setTheme, isDark, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  return context;
};
