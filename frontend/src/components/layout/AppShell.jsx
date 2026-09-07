import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { RouteFallback } from './RouteFallback';

/**
 * Responsive application shell (frontend-spec.md §4.4).
 * Desktop (`lg` up): fixed sidebar with content offset `ps-64`.
 * Mobile: sticky top bar + bottom navigation + slide-in menu sheet.
 * Suspense lives inside the shell so lazy page swaps never unmount the chrome.
 */
export function AppShell() {
  const { t } = useT();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    // Move focus to the new page's heading so screen readers announce the
    // route change (frontend-spec.md §12.3); skip on the very first render.
    document.getElementById('main')?.querySelector('h1')?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-field-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        {t('common.skipToMain')}
      </a>

      <Sidebar className="hidden lg:flex" />
      <Navbar className="lg:hidden" onMenuOpen={() => setMenuOpen(true)} />

      <main id="main" tabIndex={-1} className="outline-none lg:ps-64">
        <div className="mx-auto max-w-6xl p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-8">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <BottomNav className="lg:hidden" />
      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
