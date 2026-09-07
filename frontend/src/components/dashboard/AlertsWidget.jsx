import { useT } from '../../i18n/useT';
import { Banner, ErrorState, Skeleton } from '../ui';

const BANNER_TONES = {
  danger: 'error',
  error: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info',
};

/**
 * Active alert cards (frontend-spec.md §8.1 widget 4): weather warnings and
 * disease risk in tone colors. Omitted entirely when there is nothing to say.
 */
export function AlertsWidget({ status, alerts, onRetry }) {
  const { t } = useT();

  if (status === 'loading') {
    return <Skeleton className="h-14 rounded-lg" />;
  }
  if (status === 'error') {
    return <ErrorState compact message={t('home.alertsError')} onRetry={onRetry} />;
  }
  if (!alerts?.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert, index) => (
        <Banner key={`${alert.type}-${index}`} tone={BANNER_TONES[alert.tone] ?? 'info'}>
          {alert.text}
        </Banner>
      ))}
    </div>
  );
}
