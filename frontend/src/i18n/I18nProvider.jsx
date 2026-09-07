import { createContext, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage';
import en from './locales/en';
import ur from './locales/ur';
import urLatn from './locales/ur-Latn';

/**
 * Minimal dependency-free i18n foundation (frontend-spec.md §13):
 * - three locales: en (default), ur (RTL), ur-Latn (Roman Urdu)
 * - `t()` resolves dot-notation keys with English fallback, then the key itself
 * - switching a language updates <html lang/dir> before paint and persists `agri.lang`
 */
const LOCALES = { en, ur, 'ur-Latn': urLatn };

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'ur-Latn', label: 'Roman Urdu', dir: 'ltr' },
];

const STORAGE_KEY = 'agri.lang';
const DEFAULT_LANG = 'en';

const I18nContext = createContext(null);

function resolve(dict, key) {
  const value = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), dict);
  return typeof value === 'string' ? value : undefined;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = storage.get(STORAGE_KEY);
    return LANGUAGES.some((l) => l.code === stored) ? stored : DEFAULT_LANG;
  });

  // useLayoutEffect: apply lang/dir before paint so an RTL session never flashes LTR.
  useLayoutEffect(() => {
    const language = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = language.dir;
    storage.set(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key) => resolve(LOCALES[lang], key) ?? resolve(en, key) ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };
