import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

/**
 * Access the active theme.
 * Returns `{ theme, resolvedTheme, setTheme }` where:
 * - `theme` is the raw preference ('light' | 'dark' | 'system')
 * - `resolvedTheme` is the effective value ('light' | 'dark')
 * - `setTheme` updates the preference and persists it
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
