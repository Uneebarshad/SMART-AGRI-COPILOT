import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { useAuth } from '../../auth/AuthProvider';
import { LANGUAGES } from '../../i18n/I18nProvider';
import { BrandMark } from './BrandMark';
import { NAV_ITEMS, SECONDARY_ITEMS } from './navItems';
import { XIcon } from '../ui/icons/XIcon';
import { GlobeIcon } from '../ui/icons/GlobeIcon';

function focusableIn(panel) {
  if (!panel) return [];
  return [...panel.querySelectorAll('a[href], button:not([disabled])')];
}

const linkClasses = ({ isActive }) =>
  cn(
    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
    isActive
      ? 'bg-field-50 dark:bg-field-900/20 font-semibold text-field-800 dark:text-field-400'
      : 'font-medium text-soil-600 hover:bg-soil-100 hover:text-soil-900 dark:hover:bg-white/5',
  );

/**
 * Mobile navigation sheet opened from the top bar (frontend-spec.md §4.4).
 * Implements the dialog requirements from §12.3: backdrop click, Escape to
 * close, Tab focus trap, scroll lock, and focus restore on close.
 */
export function MobileMenuSheet({ open, onClose }) {
  const { t, lang, setLang } = useT();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || user?.email || t('common.guestFarmer');

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    focusableIn(panelRef.current)[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableIn(panelRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.menu')}
        className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col bg-nav shadow-raised"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-soil-200 pe-2 ps-4">
          <span className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-semibold tracking-tight text-soil-900">
              {t('common.brandName')}
            </span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.closeMenu')}
            className="flex h-11 w-11 items-center justify-center rounded-md text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink to={item.path} className={linkClasses} onClick={onClose}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-soil-200" />

          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-soil-400">
            {t('common.moreNav')}
          </p>
          <ul className="space-y-1">
            {SECONDARY_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink to={item.path} className={linkClasses} onClick={onClose}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 border-t border-soil-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/30 dark:text-field-400 text-xs font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-soil-900">{displayName}</p>
              {user?.email && <p className="truncate text-xs text-soil-500">{user.email}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mb-3 flex w-full items-center justify-center rounded-lg border border-soil-200 bg-surface px-3 py-2 text-sm font-medium text-soil-700 transition-colors hover:bg-soil-50 dark:border-soil-300 dark:text-soil-300 dark:hover:bg-white/5"
          >
            Sign out
          </button>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-soil-400">
            <GlobeIcon className="h-4 w-4" />
            {t('common.language')}
          </p>
          <div role="group" aria-label={t('common.language')} className="mt-2 grid grid-cols-3 gap-2">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => setLang(language.code)}
                aria-pressed={lang === language.code}
                className={cn(
                  'flex min-h-11 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
                  lang === language.code
                    ? 'border-field-600 bg-field-50 text-field-800 dark:border-field-500 dark:bg-field-900/20 dark:text-field-400'
                    : 'border-soil-300 text-soil-700 hover:bg-soil-100',
                )}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
