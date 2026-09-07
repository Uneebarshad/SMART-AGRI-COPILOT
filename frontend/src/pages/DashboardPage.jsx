import { Link } from 'react-router-dom';
import { useAppSettings } from '../settings/useAppSettings';
import { usePageTitle } from '../hooks/usePageTitle';
import { DISTRICTS, districtName } from '../lib/districts';
import { formatDate } from '../lib/format';
import { Card, StatCard, StatCardSkeleton, ErrorState } from '../components/ui';
import { AlertsWidget } from '../components/dashboard/AlertsWidget';
import { FieldsSummary } from '../components/dashboard/FieldsSummary';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { RecommendationsWidget } from '../components/dashboard/RecommendationsWidget';
import { WeatherNow } from '../components/dashboard/WeatherNow';
import { AiInsightsWidget } from '../components/dashboard/AiInsightsWidget';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { useDashboard } from '../hooks/useDashboard';

function greetingKey(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Dashboard — the hero experience.
 * Fetches the composite dashboard payload from the backend API.
 * Tells the Agri Copilot story within seconds of opening the app.
 */
export function DashboardPage() {
  const { district } = useAppSettings();
  usePageTitle('Dashboard');

  const { data, status, retry } = useDashboard();
  const now = new Date();
  const districtEntry = DISTRICTS.find((entry) => entry.id === district);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Hero / Welcome area */}
      <header className="relative overflow-hidden rounded-xl border border-soil-200 bg-surface p-5 md:p-7 shadow-card">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-soil-500">
            <span>{formatDate(now, 'en')}</span>
            {districtEntry && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">·</span>
                <MapPinIcon className="h-4 w-4 text-field-600 dark:text-field-400" />
                {districtName(districtEntry, 'en')}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-soil-900 md:text-3xl">
            {greetingKey(now)}, Farmer
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
              Ask AI copilot
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

        {/* Subtle decorative green glow — premium, not dominant */}
        <div className="pointer-events-none absolute -end-10 -top-10 h-44 w-44 rounded-full bg-field-200/50 dark:bg-field-500/10 blur-3xl" aria-hidden="true" />
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
          <Link
            to="/fields"
            className="inline-flex items-center gap-1 text-sm font-medium text-field-700 dark:text-field-400 transition-colors duration-150 hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2 rounded-sm"
          >
            View all fields
            <ChevronRightIcon className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
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
            <StatCard icon={MapPinIcon} label="Active fields" value={data.fields?.length ?? 0} tone="field" />
            <StatCard
              icon={SproutIcon}
              label="Total area"
              value={(data.fields ?? []).reduce((sum, f) => sum + f.area_ha, 0).toFixed(1)}
              unit="ha"
              tone="teal"
            />
            <StatCard icon={LeafIcon} label="Active crops" value={new Set((data.fields ?? []).map(f => f.crop)).size} tone="leaf" />
            <StatCard
              icon={CloudRainIcon}
              label="Temperature"
              value={data.weather?.current?.temperature_c ?? '—'}
              unit="°C"
              tone="sky"
            />
          </div>
        )}
      </section>

      {/* Weather + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)] lg:items-start">
        <WeatherNow status={status} weather={data?.weather} onRetry={retry} />
        <QuickActions />
      </div>

      {/* Alerts */}
      <AlertsWidget status={status} alerts={data?.alerts} onRetry={retry} />

      {/* AI Insights — the hero AI section */}
      <AiInsightsWidget insights={data?.ai_insights} />

      {/* Fields + Recommendations */}
      <div className="grid gap-8 xl:grid-cols-2">
        <FieldsSummary status={status} fields={data?.fields} onRetry={retry} />
        <RecommendationsWidget status={status} recommendations={data?.recommendations} onRetry={retry} />
      </div>

      {/* Recent Activity */}
      <RecentActivity status={status} recentActivity={data?.recent_activity} onRetry={retry} />
    </div>
  );
}

export default DashboardPage;
