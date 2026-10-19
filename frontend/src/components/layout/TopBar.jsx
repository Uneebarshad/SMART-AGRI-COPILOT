import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useT } from '../../i18n/useT';
import { useAuth } from '../../auth/AuthProvider';
import { fetchNotifications } from '../../services/api';
import { SearchIcon } from '../ui/icons/SearchIcon';
import { BellIcon } from '../ui/icons/BellIcon';
import { UserIcon } from '../ui/icons/UserIcon';
import { ChevronDownIcon } from '../ui/icons/ChevronDownIcon';

/**
 * Desktop top bar (reference design): global search, notification bell with
 * unread badge, and the signed-in farmer's identity. Search hands its query
 * to the AI assistant composer via the existing `prefill` state contract.
 */
export function TopBar({ className }) {
  const { t } = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  const loadNotifications = useCallback(() => {
    fetchNotifications()
      .then((items) => setNotifications(Array.isArray(items) ? items : []))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Dismiss the bell popover on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = user?.name || user?.email || t('common.guestFarmer');

  const handleSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate('/assistant', value ? { state: { prefill: value } } : undefined);
  };

  return (
    <header className={cn('border-b border-soil-200 bg-surface/95 backdrop-blur dark:bg-[#0b2224]/85', className)}>
      <div className="flex h-16 items-center gap-3 px-4 md:gap-5 md:px-6 lg:px-8">
        {/* Search — routes into the AI assistant */}
        <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 md:block lg:max-w-xl" role="search">
          <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soil-400 transition-colors dark:text-soil-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            aria-label={t('topbar.searchLabel')}
            className={cn(
              'h-11 w-full rounded-xl border border-soil-200 bg-page ps-10 pe-4 text-sm text-soil-900',
              'placeholder:text-soil-400 transition-[border-color,box-shadow] duration-200',
              'hover:border-soil-300 focus:border-field-500 focus:outline-none focus:ring-2 focus:ring-field-500/30',
              'dark:border-soil-200 dark:bg-[#0d2929] dark:text-soil-950 dark:placeholder:text-soil-500 dark:hover:border-soil-300',
            )}
          />
        </form>

        <div className="ms-auto flex items-center gap-1.5 md:gap-3">
          {/* Notifications bell + unread badge */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label={t('topbar.notificationsAria')}
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-full text-soil-600 transition-colors',
                'hover:bg-soil-100 hover:text-soil-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
                'dark:text-soil-500 dark:hover:bg-field-500/10 dark:hover:text-soil-900',
              )}
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute end-2 top-2 h-2.5 w-2.5 rounded-full bg-field-500 ring-2 ring-surface dark:bg-field-400 dark:ring-[#0b2224]"
                />
              )}
            </button>

            {open && (
              <div
                role="dialog"
                aria-label={t('topbar.notificationsAria')}
                className={cn(
                  'absolute end-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-soil-200 bg-surface shadow-raised',
                  'dark:border-soil-200 dark:bg-[#0d2929]',
                )}
              >
                <p className="border-b border-soil-100 px-4 py-3 text-sm font-semibold text-soil-900 dark:border-soil-200 dark:text-soil-950">
                  {t('topbar.notifications')}
                </p>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-soil-500 dark:text-soil-600">{t('topbar.noNotifications')}</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {notifications.slice(0, 6).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigate('/notifications');
                          }}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-start text-sm transition-colors',
                            'hover:bg-soil-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-field-500',
                            'dark:hover:bg-field-500/[0.08]',
                          )}
                        >
                          {!n.read && <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-field-500 dark:bg-field-400" />}
                          <span className={cn('min-w-0 flex-1', n.read && 'ps-5')}>
                            <span className="block truncate font-medium text-soil-900 dark:text-soil-950">{n.title}</span>
                            <span className="mt-0.5 line-clamp-2 block text-xs text-soil-500 dark:text-soil-600">{n.body}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/notifications');
                  }}
                  className="block w-full border-t border-soil-100 px-4 py-2.5 text-center text-sm font-medium text-field-700 transition-colors hover:bg-soil-50 dark:border-soil-200 dark:text-field-400 dark:hover:bg-field-500/[0.08]"
                >
                  {t('topbar.viewAllNotifications')}
                </button>
              </div>
            )}
          </div>

          {/* Signed-in farmer identity */}
          <div className="flex items-center gap-2.5 rounded-full ps-1 pe-2 py-1">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-field-600 text-white dark:bg-gradient-to-br dark:from-field-500 dark:to-field-600 dark:text-[#04120E]"
            >
              <UserIcon className="h-5 w-5" />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-40 truncate text-sm font-semibold text-soil-900 dark:text-soil-950">{displayName}</span>
              <span className="block text-xs text-soil-500 dark:text-soil-600">{t('topbar.role')}</span>
            </span>
            <ChevronDownIcon className="hidden h-4 w-4 text-soil-400 sm:block dark:text-soil-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
