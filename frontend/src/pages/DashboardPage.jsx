import { Link } from 'react-router-dom';
import { useAppSettings } from '../settings/useAppSettings';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../auth/AuthProvider';
import { useT } from '../i18n/useT';
import { DISTRICTS, districtName } from '../lib/districts';
import { formatDate, formatNumber } from '../lib/format';
import { Card, ErrorState, StatCard, StatCardSkeleton } from '../components/ui';
import { AlertsWidget } from '../components/dashboard/AlertsWidget';
import { CropHealthOverview } from '../components/dashboard/CropHealthOverview';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { RecommendationsWidget } from '../components/dashboard/RecommendationsWidget';
import { WeatherNow } from '../components/dashboard/WeatherNow';
import { AiInsightsWidget } from '../components/dashboard/AiInsightsWidget';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { CalendarIcon } from '../components/ui/icons/CalendarIcon';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../auth/AuthProvider';
import fieldHero from '../assets/field-hero.jpg';

function greetingKey(date, t) {
  const hour = date.getHours();
<<<<<<< Updated upstream
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* First name from the authenticated profile/session — never hardcoded. Falls
   back to the email local-part, then a neutral greeting, so it is always real
   user data. */
function firstNameOf(user) {
  const raw = user?.name?.trim() || user?.email?.split('@')[0]?.trim() || 'Farmer';
  const first = raw.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
=======
  if (hour < 12) return t('home.greetingMorning');
  if (hour < 17) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

/** Decorative hero foliage — subtle, brand-green, never dominant. */
function HeroLeaves() {
  return (
    <svg
      viewBox="0 0 220 160"
      aria-hidden="true"
      className="pointer-events-none absolute -end-4 bottom-0 top-0 hidden h-full w-auto text-field-500/40 md:block dark:text-field-400/30"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M150 160 C 150 110, 160 70, 185 35" />
        <path d="M150 160 C 135 120, 120 95, 95 70" />
        <path d="M185 120 C 200 110, 210 95, 212 75" />
      </g>
      <g fill="currentColor">
        <path d="M185 35 C 165 30, 150 40, 148 58 C 168 62, 182 52, 185 35 Z" />
        <path d="M188 60 C 205 52, 216 56, 220 70 C 205 80, 192 75, 188 60 Z" />
        <path d="M95 70 C 80 58, 62 58, 50 68 C 60 84, 80 86, 95 70 Z" />
        <path d="M118 100 C 105 88, 88 88, 76 98 C 86 113, 105 115, 118 100 Z" />
        <path d="M170 95 C 158 82, 140 82, 128 92 C 138 108, 157 110, 170 95 Z" />
      </g>
    </svg>
  );
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  const { t } = useT();
>>>>>>> Stashed changes
  usePageTitle('Dashboard');

  const { data, status, retry } = useDashboard();
  const now = new Date();
  const greetName = firstNameOf(user);
  const districtEntry = DISTRICTS.find((entry) => entry.id === district);

  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Farmer';
  const fields = status === 'success' ? (data?.fields ?? []) : [];
  const crops = [...new Set(fields.map((f) => f.crop).filter(Boolean))];
  const totalAreaHa = fields.reduce((sum, f) => sum + (f.area_ha ?? 0), 0);
  const latestScan = data?.recent_activity?.last_scan;
  const healthyCount = latestScan?.is_healthy ? fields.length : Math.max(fields.length - 1, 0);
  const weather = data?.weather?.current;

  return (
<<<<<<< Updated upstream
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Hero / Welcome area */}
      <header className="relative overflow-hidden rounded-xl border border-soil-200 bg-surface p-5 md:p-7 shadow-card">
        {/* Real field photograph (bundled) spanning the FULL hero card, blended
            into the navy card with a dark-navy gradient so the greeting and
            buttons stay readable on the left while the field shows through on
            the right. The photo is shown as-is — no blur or recolor. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fieldHero})` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(var(--agri-surface)) 0%, rgb(var(--agri-surface)) 40%, rgba(20,30,51,0.78) 64%, rgba(20,30,51,0.42) 100%)',
          }}
        />
        {/* Extra darkening on small screens so wrapped text stays readable. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#141E33]/55 sm:hidden" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-soil-500">
            <span>{formatDate(now, 'en')}</span>
            {districtEntry && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">·</span>
                <MapPinIcon className="h-4 w-4 text-field-600 dark:text-field-400" />
                {districtName(districtEntry, 'en')}
=======
    <div className="flex animate-[fadeIn_0.4s_ease-out] flex-col gap-6 md:gap-7">
      {/* Hero / welcome — the visual focal point: spacious, agricultural
          gradient with a soft green light from the top-trailing corner. */}
      <header className="relative overflow-hidden rounded-2xl border border-soil-200 bg-gradient-to-br from-soil-50 via-surface to-surface p-6 shadow-card md:p-9 dark:border-soil-200 dark:bg-[radial-gradient(130%_150%_at_88%_-30%,rgba(57,211,83,0.22),rgba(11,34,36,0.6)_45%,#0b2224_100%)]">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-soil-500 dark:text-soil-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDate(now, 'en')}
>>>>>>> Stashed changes
              </span>
              {districtEntry && (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true">·</span>
                  <MapPinIcon className="h-3.5 w-3.5 text-field-600 dark:text-field-400" />
                  {districtName(districtEntry, 'en')}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-soil-900 md:text-4xl">
              {greetingKey(now, t)},{' '}
              <span className="text-field-600 dark:text-field-400">{firstName}!</span>{' '}
              <span aria-hidden="true">🌱</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-soil-600 dark:text-soil-600 md:text-base">
              {t('home.heroSubtitle')}
            </p>
          </div>
<<<<<<< Updated upstream
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-soil-900 md:text-3xl">
            {greetingKey(now)}, <span className="text-field-600 dark:text-field-400">{greetName}</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-soil-500">
            Here&apos;s what your farm needs today. Your AI copilot has reviewed your fields, weather, and recent scans to surface the most important actions.
          </p>

          {/* Quick AI entry */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/assistant"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-lg bg-field-600 px-4 text-sm font-medium text-white shadow-card transition-colors duration-150 hover:bg-field-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2"
            >
              <ChatIcon className="h-4 w-4" />
              Ask AI Assistant
            </Link>
            <Link
              to="/diagnosis"
              className="inline-flex min-h-11 items-center gap-2.5 rounded-lg border border-soil-200 dark:border-soil-300 bg-surface px-4 text-sm font-medium text-soil-800 shadow-card transition-colors duration-150 hover:bg-soil-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2"
            >
              <LeafIcon className="h-4 w-4 text-leaf-600 dark:text-leaf-400" />
              Scan a leaf
            </Link>
          </div>
        </div>
      </header>

      {/* Farm overview stats */}
      <section aria-labelledby="farm-overview-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="farm-overview-heading" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
              Farm overview
            </h2>
            <p className="mt-0.5 text-sm text-soil-500">A quick look at your active fields and crops.</p>
          </div>
=======

          {/* Total fields chip */}
>>>>>>> Stashed changes
          <Link
            to="/fields"
            className="group flex min-w-44 items-center gap-3 rounded-2xl border border-soil-200 bg-surface/70 p-4 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-field-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 dark:border-soil-200 dark:bg-[#0d2929]/70"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-field-100 text-field-700 dark:bg-gradient-to-br dark:from-field-500/25 dark:to-field-600/10 dark:text-field-300 dark:ring-1 dark:ring-inset dark:ring-field-500/25">
              <SproutIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-soil-500 dark:text-soil-600">{t('nav.fields')}</span>
              <span className="block font-display text-xl font-semibold text-soil-900 dark:text-soil-950">
                {status === 'success' ? fields.length : '—'}
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-soil-500 rtl:-scale-x-100" />
          </Link>
        </div>

        <HeroLeaves />
      </header>

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
                sub={`${fields.length} ${t('nav.fields').toLowerCase()}`}
                tone="teal"
                showChevron
                className="h-full"
              />
            </Link>
            <Link to="/fields" className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2">
              <StatCard
                icon={CheckCircleIcon}
                label={t('home.kpiHealthyFields')}
                value={fields.length ? healthyCount : 0}
                sub={fields.length ? `${fields.length - healthyCount} ${t('home.attentionNeeded')}` : t('home.addFirstFieldSub')}
                tone="leaf"
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
          <AiInsightsWidget insights={data?.ai_insights} />
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
