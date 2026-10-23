import { Link } from 'react-router-dom';
import { useAppSettings } from '../settings/useAppSettings';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/useT';
import { DISTRICTS, districtName } from '../lib/districts';
import { formatDate, formatNumber, relativeTime } from '../lib/format';
import { Card, ErrorState, StatCard, StatCardSkeleton } from '../components/ui';
import { AlertsWidget } from '../components/dashboard/AlertsWidget';
import { CropHealthOverview } from '../components/dashboard/CropHealthOverview';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { RecommendationsWidget } from '../components/dashboard/RecommendationsWidget';
import { WeatherNow } from '../components/dashboard/WeatherNow';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { CalendarIcon } from '../components/ui/icons/CalendarIcon';
import { useDashboard } from '../hooks/useDashboard';
import fieldHero from '../assets/field-hero.jpg';

function greetingKey(date, t) {
  const hour = date.getHours();
  if (hour < 12) return t('home.greetingMorning');
  if (hour < 17) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

/**
 * Dashboard — the hero experience (reference design).
 * Hero greeting + total-fields chip, a KPI row built from the composite
 * API payload, the crop health card with quick actions and recent activity
 * alongside it, then the remaining data widgets below.
 */
export function DashboardPage() {
  const { district } = useAppSettings();
  const { user } = useAuth();
  const { t, lang } = useT();
  usePageTitle('Dashboard');

  const { data, status, retry } = useDashboard();
  const now = new Date();
  const districtEntry = DISTRICTS.find((entry) => entry.id === district);

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Farmer';
  const fields = status === 'success' ? (data?.fields ?? []) : [];
  const crops = [...new Set(fields.map((f) => f.crop).filter(Boolean))];
  const totalAreaHa = fields.reduce((sum, f) => sum + (f.area_ha ?? 0), 0);
  const latestScan = data?.recent_activity?.last_scan;
  // Honest crop status from the one real signal we have — the latest leaf
  // scan. Missing data shows as "Unchecked", never as a fabricated count of
  // "healthy fields" inferred from an unrelated scan.
  const cropStatus = !latestScan
    ? { value: t('home.statusUnchecked'), sub: t('home.tapToCheck'), tone: 'neutral' }
    : latestScan.is_healthy
      ? {
          value: t('home.scanHealthy'),
          sub: latestScan.scanned_at ? relativeTime(latestScan.scanned_at, lang) : t('home.cropHealthSubtitle'),
          tone: 'leaf',
        }
      : { value: t('home.statusAttention'), sub: latestScan.disease || t('home.needsAttention'), tone: 'sun' };
  const weather = data?.weather?.current;

  return (
    <div className="flex animate-[fadeIn_0.4s_ease-out] flex-col gap-6 md:gap-7">
      {/* Welcome / greeting — dynamic user name, date and district preserved. */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-soil-900 md:text-3xl dark:text-soil-950">
            {greetingKey(now, t)},{' '}
            <span className="text-field-600 dark:text-field-400">{firstName}</span>{' '}
            <span aria-hidden="true">🌱</span>
          </h1>
          <p className="mt-1 text-sm text-soil-600 dark:text-soil-600 md:text-base">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-medium text-soil-500 dark:text-soil-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(now, 'en')}
          </span>
          {districtEntry && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">·</span>
              <MapPinIcon className="h-3.5 w-3.5 text-field-600 dark:text-field-400" />
              {districtName(districtEntry, 'en')}
            </span>
          )}
        </div>
      </header>

      {/* Hero banner — premium agricultural field photograph with a navy
          gradient overlay for legibility (reference design). */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-soil-200 shadow-card dark:border-soil-200">
        <img
          src={fieldHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        {/* Navy scrim: strongest behind the text, easing toward the field. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B1220]/95 via-[#0B1220]/80 to-[#0B1220]/35"
        />
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 md:p-9">
          <div className="min-w-0 max-w-xl">
            <h2 className="font-sans text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
              {t('home.heroTitle')}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85 md:text-base">
              {t('home.heroBannerSubtitle')}
            </p>
          </div>

          {/* Total fields chip — preserved link + live count, restyled for the photo. */}
          <Link
            to="/fields"
            className="group flex min-w-44 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-card backdrop-blur-md transition-colors duration-200 hover:border-field-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-field-500/20 text-field-300 ring-1 ring-inset ring-field-400/30">
              <SproutIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-white/70">{t('nav.fields')}</span>
              <span className="block font-display text-xl font-semibold text-white">
                {status === 'success' ? fields.length : '—'}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </section>

      {/* KPI summary cards — real dashboard payload values */}
      <section aria-label={t('home.cropHealthTitle')}>
        {status === 'loading' && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        )}
        {status === 'error' && (
          <Card>
            <ErrorState title="Couldn't load dashboard" message="Your farm overview could not be loaded. Try again to continue." onRetry={retry} />
          </Card>
        )}
        {status === 'success' && data && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link to="/fields" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2">
              <StatCard
                icon={LeafIcon}
                label={t('home.kpiTotalCrops')}
                value={crops.length}
                sub={crops.length ? crops.join(', ') : t('home.noCropsYet')}
                tone="field"
                showChevron
                className="h-full"
              />
            </Link>
            <Link to="/fields" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2">
              <StatCard
                icon={ChartIcon}
                label={t('home.kpiTotalArea')}
                value={formatNumber(Number((totalAreaHa * 2.47105).toFixed(1)), 'en')}
                unit={t('home.unitAcres')}
                sub={`${fields.length} ${fields.length === 1 ? t('home.fieldsOne') : t('home.fieldsMany')}`}
                tone="teal"
                showChevron
                className="h-full"
              />
            </Link>
            <Link to="/diagnosis" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2">
              <StatCard
                icon={CheckCircleIcon}
                label={t('home.kpiCropStatus')}
                value={cropStatus.value}
                sub={cropStatus.sub}
                tone={cropStatus.tone}
                showChevron
                className="h-full"
              />
            </Link>
            <Link to="/weather" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2">
              <StatCard
                icon={CloudRainIcon}
                label={t('home.kpiCurrentWeather')}
                value={weather?.temperature_c ?? '—'}
                unit="°C"
                sub={weather?.condition_text || weather?.condition || t('home.tapForForecast')}
                tone="sky"
                showChevron
                className="h-full"
              />
            </Link>
          </div>
        )}
      </section>

      {/* Crop health + quick actions / recent activity */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <CropHealthOverview status={status} fields={data?.fields} latestScan={latestScan} onRetry={retry} />
          <AlertsWidget status={status} alerts={data?.alerts} onRetry={retry} />
          <WeatherNow status={status} weather={data?.weather} onRetry={retry} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <QuickActions />
          <RecentActivity status={status} recentActivity={data?.recent_activity} onRetry={retry} />
        </div>
      </div>

      {/* Recommendations */}
      <RecommendationsWidget status={status} recommendations={data?.recommendations} onRetry={retry} />
    </div>
  );
}

export default DashboardPage;
