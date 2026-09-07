import { useT } from '../../i18n/useT';
import { Skeleton } from '../ui/Skeleton';

/**
 * Suspense fallback shown while a lazy route chunk loads (frontend-spec.md §18.3).
 * Mirrors the page layout (heading, subtitle, content cards) so the swap is calm.
 */
export function RouteFallback() {
  const { t } = useT();

  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        {t('common.loading')}
      </p>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-24 rounded-xl" />
    </div>
  );
}
