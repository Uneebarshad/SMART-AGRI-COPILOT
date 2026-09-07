import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { Badge } from '../ui';
import { CONFIDENCE_TONES, cropLabelKey, getConfidenceTier } from '../../lib/diagnosis';
import { formatDate } from '../../lib/format';
import { pickLocalized } from '../../lib/localized';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';

/**
 * Recent scans under the capture area (frontend-spec.md §7.5): thumbnail,
 * crop, disease (or "Uncertain"), confidence badge and date — tap opens the
 * saved result at /diagnosis/:scanId. Thumbnails fall back to a leaf
 * placeholder because photos are never persisted (Appendix A10).
 */
export function PastScans({ scans }) {
  const { t, lang } = useT();

  return (
    <section aria-labelledby="past-scans-title">
      <h2 id="past-scans-title" className="text-base font-semibold text-soil-900">
        {t('diagnosis.pastTitle')}
      </h2>
      {scans.length === 0 ? (
        <p className="py-8 text-center text-sm text-soil-500">{t('diagnosis.pastEmpty')}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {scans.map((scan) => {
            const label =
              scan.disease_localized && scan.status === 'diagnosed'
                ? pickLocalized(scan.disease_localized, lang)
                : scan.status === 'healthy'
                  ? t('diagnosis.healthyLabel')
                  : t('diagnosis.uncertainLabel');
            const tier = scan.confidence != null ? getConfidenceTier(scan.confidence) : null;
            const cropKey = cropLabelKey(scan.crop);
            return (
              <li key={scan.id}>
                <Link
                  to={`/diagnosis/${scan.id}`}
                  className="flex items-center gap-3 rounded-xl border border-soil-200 bg-surface p-3 shadow-card transition-colors hover:border-soil-300 dark:hover:border-soil-300 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-field-50 text-field-600 dark:bg-field-900/20 dark:text-field-400">
                    <LeafIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-soil-900">{label}</span>
                    <span className="mt-0.5 block text-xs text-soil-500">
                      {cropKey ? `${t(cropKey)} · ` : ''}
                      {formatDate(scan.created_at, lang)}
                    </span>
                  </span>
                  {tier && (
                    <Badge tone={CONFIDENCE_TONES[tier]} className="shrink-0">
                      {Math.round(scan.confidence * 100)} %
                    </Badge>
                  )}
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 rtl:-scale-x-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
