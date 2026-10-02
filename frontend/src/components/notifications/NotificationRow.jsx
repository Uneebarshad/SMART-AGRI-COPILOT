import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { formatRelativeTime, typeMeta } from './notificationPresentation';

/**
 * One inbox row. Unread rows are distinguishable by more than color — a
 * "New" pill plus an accent dot — and clicking opens the deep link while
 * marking the row read. Rows without a deep link stay non-interactive
 * except for the explicit mark-read button.
 */
export function NotificationRow({ notification, onMarkRead, compact = false }) {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { Icon, tile } = typeMeta(notification.type);
  const unread = !notification.read;

  const open = () => {
    if (notification.deepLink) {
      if (unread) onMarkRead(notification.id);
      navigate(notification.deepLink);
    } else if (unread) {
      onMarkRead(notification.id);
    }
  };

  return (
    <li>
      <div
        className={cn(
          'flex gap-3 px-3 py-3 transition-colors',
          notification.deepLink || unread ? 'cursor-pointer hover:bg-soil-50 dark:hover:bg-soil-300/70' : '',
          unread && 'bg-field-50 dark:bg-field-900/15',
        )}
        role={notification.deepLink || unread ? 'button' : undefined}
        tabIndex={notification.deepLink || unread ? 0 : undefined}
        onClick={notification.deepLink || unread ? open : undefined}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && (notification.deepLink || unread)) {
            event.preventDefault();
            open();
          }
        }}
      >
        <span
          aria-hidden="true"
          className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tile)}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'truncate text-sm text-soil-900',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {notification.title}
            </h3>
            {unread && (
              <span className="shrink-0 rounded-full bg-field-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-white">
                {t('notifications.newBadge')}
              </span>
            )}
          </div>
          <p className={cn('mt-0.5 text-xs leading-relaxed text-soil-600', compact ? 'line-clamp-2' : 'line-clamp-3')}>
            {notification.body}
          </p>
          <p className="mt-1 text-xs text-soil-400">{formatRelativeTime(notification.createdAt, lang)}</p>
        </div>
        {unread && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
            aria-label={t('notifications.markReadAria')}
            title={t('notifications.markReadAria')}
            className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full text-soil-400 transition-colors hover:bg-soil-100 hover:text-field-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 dark:hover:bg-soil-300"
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-field-500" />
          </button>
        )}
      </div>
    </li>
  );
}
