import { useContext } from 'react';
import { I18nContext } from './I18nProvider';

/**
 * Translation hook (frontend-spec.md §13.2).
 * Returns { lang, setLang, t } — components normally destructure `t`.
 */
export function useT() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useT must be used within an I18nProvider');
  }
  return context;
}
