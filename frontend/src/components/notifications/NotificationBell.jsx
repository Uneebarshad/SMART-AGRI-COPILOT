import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { useNotificationsStore } from '../../notifications/NotificationsProvider';
import { BellIcon } from '../ui/icons/BellIcon';
import { NotificationRow } from './NotificationRow';
import { Skeleton } from '../ui';

const PANEL_LIMIT = 6;

/**
 * Bell trigger + dropdown inbox panel (notifications redesign §9). The badge
 * shows the genuine unread count from the backend — it disappears when the
 * real inbox is empty, and never displays a made-up number.
 */
export function NotificationBell({ className }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { notifications, status, unreadCount, refresh, markRead, markAllRead, refreshSilent } =
    useNotificationsStore();

  /* Every open revalidates silently, so a scan or advisory finished moments
     ago shows up without a page reload. */
  useEffect(() => {
    if (open) refreshSilent();
  }, [open, refreshSilent]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const visible = notifications.slice(0, PANEL_LIMIT);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `${t('notifications.title')} — ${t('notifications.unreadCount').replace('%d', unreadCount)}`
            : t('notifications.title')
        }
        className={cn(
          'relative flex h-11 w-11 items-center justify-center rounded-md transition-colors',
          'text-soil-700 hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
          'dark:text-soil-400 dark:hover:bg-soil-300',
          open && 'bg-soil-100 dark:bg-soil-300',
        )}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-field-600 px-1 text-[10px] font-bold leading-none text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('notifications.title')}
          className="absolute end-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-soil-200 bg-surface shadow-raised dark:border-soil-300"
        >
          <div className="flex items-center justify-between border-b border-soil-200 px-4 py-3 dark:border-soil-300">
            <h2 className="text-sm font-semibold text-soil-900">{t('notifications.title')}</h2>
            {status === 'success' && unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-field-700 transition-colors hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 dark:text-field-400"
              >
                {t('notifications.markAll')}
              </button>
            )}
          </div>

          {status === 'loading' && (
            <div className="space-y-3 p-4" role="status" aria-label={t('common.loading')}>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 text-center">
              <p className="text-sm text-soil-600">{t('notifications.loadError')}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-2 text-sm font-medium text-field-700 hover:text-field-800 dark:text-field-400"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          )}

          {status === 'success' && visible.length === 0 && (
            <div className="px-4 py-8 text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400"
              >
                <BellIcon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-soil-800">{t('notifications.emptyTitle')}</p>
              <p className="mt-1 text-xs text-soil-500">{t('notifications.emptyDesc')}</p>
            </div>
          )}

          {status === 'success' && visible.length > 0 && (
            <ul className="max-h-80 divide-y divide-soil-100 overflow-y-auto dark:divide-soil-200">
              {visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markRead}
                  compact
                />
              ))}
            </ul>
          )}

          <div className="border-t border-soil-200 px-4 py-2.5 text-center dark:border-soil-300">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-9 items-center text-sm font-medium text-ai-700 transition-colors hover:text-ai-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-500 dark:text-ai-400"
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
