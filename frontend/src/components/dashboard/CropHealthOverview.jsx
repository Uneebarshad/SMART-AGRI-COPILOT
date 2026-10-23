import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { formatNumber, relativeTime } from '../../lib/format';
import { Badge, ButtonLink, ErrorState, Skeleton } from '../ui';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { PlusIcon } from '../ui/icons/PlusIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';

/**
 * Crop health overview (reference design): every field as a row — crop,
 * area, and the health badge derived from the latest real scan result.
 * No scan yet renders as "Not checked" with a nudge to run one, so the
 * widget only ever shows data the backend actually has.
 */

const CROP_TILES = {
  wheat: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-400',
  cotton: 'bg-soil-100 text-soil-700 dark:bg-soil-300/40 dark:text-soil-500',
  maize: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-400',
  rice: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
};

function cropTile(crop) {
  const key = (crop ?? '').toLowerCase();
  return CROP_TILES[key] ?? 'bg-field-100 text-field-700 dark:bg-field-500/15 dark:text-field-300';
}

/** Professional agriculture illustration for the empty state: a glowing
 *  soil mound with a young sprout (pure SVG, no external asset). */
function FieldIllustration() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true" className="h-28 w-32 shrink-0 md:h-32 md:w-36">
      <defs>
        <radialGradient id="chGlow" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="rgb(57 211 83 / 0.35)" />
          <stop offset="100%" stopColor="rgb(57 211 83 / 0)" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="60" r="56" fill="url(#chGlow)" />
      {/* soil mound */}
      <path d="M28 112c6-20 22-30 52-30s46 10 52 30c-18 8-86 8-104 0Z" fill="rgb(92 61 40)" />
      <path d="M28 112c6-20 22-30 52-30s46 10 52 30" fill="rgb(120 82 54)" opacity="0.55" />
      {/* sprout stem */}
      <path d="M80 100V58" stroke="rgb(34 120 60)" strokeWidth="4" strokeLinecap="round" />
      {/* leaves */}
      <path d="M80 66C66 64 56 54 56 40c16 0 26 10 26 26Z" fill="rgb(57 211 83)" />
      <path d="M80 74c14-2 24-12 24-26-16 0-26 10-26 26Z" fill="rgb(114 224 111)" />
      <circle cx="80" cy="52" r="3" fill="rgb(217 249 157)" />
    </svg>
  );
}

function FieldRow({ field, lang }) {
  const { t } = useT();
  // Real, stored field state only. We never infer a field's health from an
  // unrelated global scan — a field with no dedicated check shows its growth
  // stage (neutral), never a fabricated "healthy" badge.
  const stage = field.growth_stage || field.status;

  return (
    <li>
      <Link
        to="/fields"
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors duration-150',
          'hover:bg-soil-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
          'dark:hover:bg-field-500/[0.06]',
        )}
      >
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cropTile(field.crop))}>
          <SproutIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-soil-900">{field.name}</p>
          <p className="mt-0.5 truncate text-xs text-soil-500">
            {field.crop ?? t('home.noCrop')} · {formatNumber(field.area_ha, lang)} {t('home.areaUnit')}
          </p>
        </div>
        {stage && <Badge tone="neutral" className="shrink-0">{stage}</Badge>}
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:-scale-x-100" />
      </Link>
    </li>
  );
}

export function CropHealthOverview({ status, fields, latestScan, onRetry }) {
  const { t, lang } = useT();

  return (
    <section
      aria-labelledby="crop-health-heading"
      className="animate-[fadeIn_0.4s_ease-out] rounded-2xl border border-soil-200 bg-surface shadow-card"
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-field-100 text-field-700 dark:bg-gradient-to-br dark:from-field-500/25 dark:to-field-600/10 dark:text-field-300 dark:ring-1 dark:ring-inset dark:ring-field-500/25">
            <LeafIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="crop-health-heading" className="text-base font-semibold text-soil-900">
              {t('home.cropHealthTitle')}
            </h2>
            <p className="text-xs text-soil-500">{t('home.cropHealthSubtitle')}</p>
          </div>
        </div>
        <Link
          to="/fields"
          className="rounded-sm pt-1 text-sm font-medium text-field-700 dark:text-field-400 transition-colors duration-150 hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500"
        >
          {t('home.viewAll')}
        </Link>
      </div>

      {/* The one real check we have — the latest leaf scan — surfaced once,
          honestly, instead of being smeared across every field row. */}
      {status === 'success' && latestScan && (
        <div className="px-5 pb-3">
          <Link
            to={`/diagnosis/${latestScan.scan_id}`}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border border-soil-200 px-3 py-2 text-xs transition-colors duration-150',
              'hover:border-field-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
              'dark:border-soil-200',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full', latestScan.is_healthy ? 'bg-field-500' : 'bg-sun-500')}
            />
            <span className="min-w-0 flex-1 truncate text-soil-500 dark:text-soil-600">
              {t('home.latestCheck')}:{' '}
              <span className="font-semibold text-soil-900 dark:text-soil-950">
                {latestScan.is_healthy ? t('home.scanHealthy') : latestScan.disease || t('home.needsAttention')}
              </span>
            </span>
            {latestScan.scanned_at && (
              <span className="shrink-0 text-soil-500 dark:text-soil-600">{relativeTime(latestScan.scanned_at, lang)}</span>
            )}
          </Link>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col gap-3 px-5 pb-5">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-14 rounded-lg" />
          ))}
        </div>
      )}
      {status === 'error' && (
        <div className="px-5 pb-5">
          <ErrorState compact message={t('home.fieldsError')} onRetry={onRetry} />
        </div>
      )}
      {status === 'success' && fields?.length === 0 && (
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center gap-5 rounded-xl border border-soil-200 bg-soil-50/60 p-6 text-center dark:border-soil-200 dark:bg-field-500/[0.04] sm:flex-row sm:text-start">
            <FieldIllustration />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <p className="font-display text-lg font-semibold text-soil-900 dark:text-soil-950">{t('home.fieldsEmptyTitle')}</p>
              <p className="max-w-sm text-sm leading-relaxed text-soil-500 dark:text-soil-600">{t('home.fieldsEmptyDesc')}</p>
              <ButtonLink to="/fields" size="sm" className="mt-1 shadow-glow">
                <PlusIcon className="h-4 w-4" />
                {t('home.addFirstField')}
              </ButtonLink>
            </div>
          </div>
        </div>
      )}
      {status === 'success' && fields?.length > 0 && (
        <ul className="flex flex-col gap-1 px-2 pb-3">
          {fields.map((field) => (
            <FieldRow key={field.id} field={field} lang={lang} />
          ))}
        </ul>
      )}

      {/* "Need help?" strip — the reference's assistant hand-off card. */}
      <div className="m-4 mt-1 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-field-50 p-4 dark:bg-field-500/[0.07]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-field-600 text-white dark:bg-field-500 dark:text-[#04120E]">
            <LeafIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-soil-900">{t('home.needHelpTitle')}</p>
            <p className="text-xs text-soil-500">{t('home.needHelpDesc')}</p>
          </div>
        </div>
        <ButtonLink
          to="/assistant"
          size="sm"
          className="shrink-0"
        >
          <ChatIcon className="h-4 w-4" />
          {t('home.chatWithAi')}
        </ButtonLink>
      </div>
    </section>
  );
}
