import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useT } from '../i18n/useT';
import { useAppSettings } from '../settings/useAppSettings';
import { useWeather } from '../hooks/useWeather';
import { Skeleton } from '../components/ui';
import { Banner } from '../components/ui';
import { ErrorState } from '../components/ui';
import { FarmingInsightCard } from '../components/weather/FarmingInsightCard';
import { CurrentWeatherCard } from '../components/weather/CurrentWeatherCard';
import { DailyForecast } from '../components/weather/DailyForecast';
import { HourlyForecast } from '../components/weather/HourlyForecast';
import { WeatherHeader } from '../components/weather/WeatherHeader';
import { WeatherMetricCard } from '../components/weather/WeatherMetricCard';

const DEFAULT_DISTRICT = 'lahore';

/** Weather (`/weather`) — real backend forecast screen. */
export function WeatherPage() {
  const { lang, t } = useT();
  const { district: appDistrict, setDistrict } = useAppSettings();
  const [activeDistrict, setActiveDistrict] = useState(appDistrict || DEFAULT_DISTRICT);
  const [refreshFeedback, setRefreshFeedback] = useState('');

  const { data: weather, status, retry, isLoading, isError } = useWeather(activeDistrict);

  usePageTitle('Weather');

  const handleDistrictChange = (newDistrictId) => {
    setActiveDistrict(newDistrictId);
    setDistrict(newDistrictId);
    setRefreshFeedback('');
  };

  const handleRefresh = () => {
    setRefreshFeedback('');
    retry();
    setRefreshFeedback(t('weather.refreshSuccess'));
  };

  // --- Loading state ---
  if (isLoading && !weather) {
    return (
      <div className="flex flex-col gap-6">
        <WeatherHeader
          location={activeDistrict}
          date=""
          onLocationChange={handleDistrictChange}
          lang={lang}
        />
        <WeatherPageSkeleton />
      </div>
    );
  }

  // --- Error state ---
  if (isError && !weather) {
    return (
      <div className="flex flex-col gap-6">
        <WeatherHeader
          location={activeDistrict}
          date=""
          onLocationChange={handleDistrictChange}
          lang={lang}
        />
        <ErrorState
          title={t('weather.errorTitle')}
          message={t('weather.errorMessage')}
          onRetry={retry}
        />
      </div>
    );
  }

  // --- No data fallback ---
  if (!weather || !weather.current) {
    return (
      <div className="flex flex-col gap-6">
        <WeatherHeader
          location={activeDistrict}
          date=""
          onLocationChange={handleDistrictChange}
          lang={lang}
        />
        <ErrorState
          title={t('weather.errorTitle')}
          message={t('weather.noCurrentData')}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WeatherHeader
        location={activeDistrict}
        date={weather.current.updated || ''}
        onLocationChange={handleDistrictChange}
        lang={lang}
      />

      {refreshFeedback && <Banner tone="success">{refreshFeedback}</Banner>}

      {/* Stale-while-revalidate: show current data even while refreshing for a new district */}
      {isLoading && weather && (
        <Banner tone="info">{t('weather.loading')}</Banner>
      )}

      <CurrentWeatherCard
        location={weather.district}
        current={weather.current}
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />

      <div className="flex flex-col gap-6">
        <HourlyForecast items={weather.hourly} />
        <DailyForecast
          items={weather.daily}
          forecastDaysAvailable={weather.forecastDaysAvailable}
          forecastDaysLimit={weather.forecastDaysLimit}
        />

        <section aria-labelledby="farming-insights-title">
          <div className="mb-4">
            <h2 id="farming-insights-title" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
              {t('weather.insightsTitle')}
            </h2>
            <p className="mt-1 text-sm text-soil-600">{t('weather.insightsSubtitle')}</p>
          </div>
          {weather.advisories.length === 0 ? (
            <p className="text-sm text-soil-500">{t('weather.insightsEmpty')}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {weather.advisories.map((insight) => (
                <FarmingInsightCard key={insight.title} {...insight} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="weather-metrics-title">
          <div className="mb-4">
            <h2 id="weather-metrics-title" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
              {t('weather.metricsTitle')}
            </h2>
            <p className="mt-1 text-sm text-soil-600">{t('weather.metricsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {weather.metrics.map((metric) => (
              <WeatherMetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Skeleton placeholder preserving the weather page structure during loading. */
function WeatherPageSkeleton() {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-soil-200 dark:border-soil-200/60 bg-surface p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
        <div className="mt-5 flex items-end gap-3">
          <Skeleton className="h-16 w-28" />
          <div className="pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-soil-200 dark:border-soil-200/60 bg-surface p-5 md:p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 py-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-soil-200 dark:border-soil-200/60 bg-surface p-5 md:p-6">
        <Skeleton className="h-4 w-28 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </>
  );
}

export default WeatherPage;
