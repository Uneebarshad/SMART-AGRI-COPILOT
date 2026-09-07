import { Link } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * 404 — unknown paths land here, standalone (outside the app shell) per
 * frontend-spec.md §4.2. Offers a clear way back home (§18.4).
 */
export function NotFoundPage() {
  const { t } = useT();
  const title = t('notFound.title');
  usePageTitle(title);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page p-4">
      <div className="w-full max-w-md rounded-xl border border-soil-200 bg-surface p-6 text-center shadow-card">
        <p className="font-display text-5xl font-semibold text-field-600">404</p>
        <h1 className="mt-3 font-display text-xl font-semibold text-soil-900">{title}</h1>
        <p className="mt-1 text-sm text-soil-600">{t('notFound.subtitle')}</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-field-600 px-4 text-sm font-medium text-white transition-colors hover:bg-field-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
        >
          {t('common.goHome')}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
