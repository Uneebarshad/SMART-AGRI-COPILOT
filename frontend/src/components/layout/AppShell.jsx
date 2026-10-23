import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { RouteFallback } from './RouteFallback';
import { ErrorBoundary } from './ErrorBoundary';
import { NotificationsProvider } from '../../notifications/NotificationsProvider';

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
    <NotificationsProvider>
      <div className="min-h-dvh bg-page">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-field-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        {t('common.skipToMain')}
      </a>

      <Sidebar className="hidden lg:flex" />
      <Navbar className="lg:hidden" onMenuOpen={() => setMenuOpen(true)} />
      {/* Desktop top bar: fixed, offset past the sidebar; its popover layer
          (z-30) stays below the sidebar (z-40) but above page content. */}
      <TopBar className="hidden lg:flex lg:fixed lg:inset-x-0 lg:top-0 lg:z-30 lg:ps-64" />

      <main id="main" tabIndex={-1} className="outline-none lg:ps-64 lg:pt-16">
        <div className="mx-auto max-w-7xl p-4 pb-24 md:p-6 md:pb-24 lg:p-8 lg:pb-8">
          <Suspense fallback={<RouteFallback />}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </div>
      </main>

      <BottomNav className="lg:hidden" />
      <MobileMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </NotificationsProvider>
  );
}
