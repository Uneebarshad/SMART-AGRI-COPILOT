import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { formatNumber } from '../../lib/format';
import { Badge, ButtonLink, Card, EmptyState, ErrorState, Skeleton } from '../ui';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { SectionHeader, sectionLinkClass } from './SectionHeader';

/**
 * My fields / crops summary (frontend-spec.md §8.1 widget 5): field cards
 * with crop badge and area, or an EmptyState CTA to add the first field.
 */
export function FieldsSummary({ status, fields, onRetry }) {
  const { t, lang } = useT();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t('home.fieldsTitle')}
        action={
          <Link to="/fields" className={sectionLinkClass}>
            {t('home.viewAll')}
          </Link>
        }
      />
      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="rounded-xl border border-soil-200 bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="mt-3 h-4 w-1/3" />
            </div>
          ))}
        </div>
      )}
      {status === 'error' && (
        <ErrorState compact message={t('home.fieldsError')} onRetry={onRetry} />
      )}
      {status === 'success' && fields?.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <li key={field.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
                    <MapPinIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-soil-900">{field.name}</p>
                      {field.crop && <Badge>{field.crop}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-soil-500">
                      {formatNumber(field.area_ha, lang)} {t('home.areaUnit')}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {status === 'success' && !fields?.length && (
        <Card>
          <EmptyState
            icon={MapPinIcon}
            title={t('home.fieldsEmptyTitle')}
            description={t('home.fieldsEmptyDesc')}
            action={<ButtonLink to="/fields">{t('home.addFirstField')}</ButtonLink>}
          />
        </Card>
      )}
    </section>
  );
}
