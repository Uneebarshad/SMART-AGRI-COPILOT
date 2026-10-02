import { useT } from '../i18n/useT';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNotificationsStore } from '../notifications/NotificationsProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, EmptyState, ErrorState, Skeleton } from '../components/ui';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { NotificationRow } from '../components/notifications/NotificationRow';

function ListSkeleton() {
  return (
    <ol className="space-y-3" aria-hidden="true">
      {[1, 2, 3, 4].map((item) => (
        <li key={item}>
          <Card className="p-0">
            <div className="flex items-start gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}

/**
 * Full notification inbox (redesign §8/§9): real events from weather
 * advisories and leaf scans, grouped unread-first, with genuine read state.
 */
export function NotificationsPage() {
  const { t } = useT();
  usePageTitle(t('notifications.title'));
  const { notifications, status, unreadCount, refresh, markRead, markAllRead } =
    useNotificationsStore();

  const unread = notifications.filter((item) => !item.read);
  const read = notifications.filter((item) => item.read);

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        action={
          unread.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              {t('notifications.markAll')}
            </Button>
          ) : null
        }
      />

      {status === 'loading' && <ListSkeleton />}

      {status === 'error' && (
        <Card>
          <ErrorState
            title={t('notifications.loadErrorTitle')}
            message={t('notifications.loadError')}
            onRetry={refresh}
          />
        </Card>
      )}

      {status === 'success' && notifications.length === 0 && (
        <Card>
          <EmptyState
            icon={SproutIcon}
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyDesc')}
            action={
              <Button variant="outline" onClick={refresh}>
                {t('notifications.checkAgain')}
              </Button>
            }
          />
        </Card>
      )}

      {status === 'success' && notifications.length > 0 && (
        <div className="space-y-8">
          {unread.length > 0 && (
            <section aria-labelledby="unread-notifications">
              <div className="mb-3 flex items-center gap-2">
                <h2 id="unread-notifications" className="font-display text-lg font-semibold tracking-tight text-soil-900">
                  {t('notifications.unreadSection')}
                </h2>
                <span className="rounded-full bg-field-100 px-2 py-0.5 text-xs font-semibold text-field-800 dark:bg-field-900/20 dark:text-field-400">
                  {unreadCount}
                </span>
              </div>
              <Card className="p-0">
                <ul className="divide-y divide-soil-100 dark:divide-soil-200">
                  {unread.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markRead}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {read.length > 0 && (
            <section aria-labelledby="read-notifications">
              <h2 id="read-notifications" className="mb-3 font-display text-lg font-semibold tracking-tight text-soil-900">
                {t('notifications.readSection')}
              </h2>
              <Card className="p-0">
                <ul className="divide-y divide-soil-100 dark:divide-soil-200">
                  {read.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markRead}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </>
  );
}

export default NotificationsPage;
