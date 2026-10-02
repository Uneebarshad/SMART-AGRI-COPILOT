import { useEffect } from 'react';

/**
 * Keeps document.title in sync with the active page (frontend-spec.md §12.4).
 * Appends the brand so tabs stay identifiable across the 14 routes.
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} · Smart Agri Copilot`;
    return undefined;
  }, [title]);
}
