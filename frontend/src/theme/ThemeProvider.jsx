import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '../lib/storage';

const THEME_KEY = 'agri.theme';
const VALID_THEMES = ['light', 'dark', 'system'];

/** Resolve 'system' to the OS preference via matchMedia. */
function resolveTheme(pref) {
  if (pref !== 'system') return pref;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ThemeContext = createContext(null);

/**
 * Centralised theme provider.
 * - Persists the user's preference (light | dark | system) under `agri.theme`.
 * - Applies the resolved value as a `dark` class on `<html>` so Tailwind's
 *   `dark:` variant and CSS custom-property overrides kick in globally.
 * - Listens for OS-level changes when 'system' is selected.
 * - Defaults to the dark navy/blue theme with agricultural-green accents;
 *   light remains fully supported via the Settings theme switch.
 */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    const stored = storage.get(THEME_KEY);
    return stored && VALID_THEMES.includes(stored) ? stored : 'dark';
  });

  const resolved = resolveTheme(preference);

  /* Apply the `dark` class to <html> and keep it in sync. */
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolved]);

  /* When 'system' is active, follow OS preference changes. */
  useEffect(() => {
    if (preference !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setPreference('system'); // trigger re-render
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((value) => {
    if (!VALID_THEMES.includes(value)) return;
    setPreference(value);
    storage.set(THEME_KEY, value);
  }, []);

  const value = useMemo(
    () => ({ theme: preference, resolvedTheme: resolved, setTheme }),
    [preference, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
