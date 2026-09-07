import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { formatNumber } from '../../lib/format';
import { cn } from '../../lib/cn';
import { ErrorState, StatCard, StatCardSkeleton } from '../ui';
import { AlertTriangleIcon } from '../ui/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { InfoIcon } from '../ui/icons/InfoIcon';
import { ThermometerIcon } from '../ui/icons/ThermometerIcon';
import { WindIcon } from '../ui/icons/WindIcon';
import { SectionHeader, sectionLinkClass } from './SectionHeader';

const ADVISORY_TONES = {
  success: {
    wrap: 'border-field-600 bg-field-50 text-field-800 hover:bg-field-100 dark:border-field-500/40 dark:bg-field-900/15 dark:text-field-400 dark:hover:bg-field-900/25',
    Icon: CheckCircleIcon,
  },
  error: {
    wrap: 'border-rust-600 bg-rust-50 text-rust-800 hover:bg-rust-100 dark:border-rust-500/40 dark:bg-rust-900/15 dark:text-rust-400 dark:hover:bg-rust-900/25',
    Icon: AlertTriangleIcon,
  },
  warning: {
    wrap: 'border-sun-600 bg-sun-50 text-sun-800 hover:bg-sun-100 dark:border-sun-500/40 dark:bg-sun-900/15 dark:text-sun-400 dark:hover:bg-sun-900/25',
    Icon: AlertTriangleIcon,
  },
  info: {
    wrap: 'border-sky-600 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-900/15 dark:text-sky-400 dark:hover:bg-sky-900/25',
    Icon: InfoIcon,
  },
};

/**
 * Current-conditions strip + top advisory (frontend-spec.md §8.1 widget 2):
 * temp, rain chance, humidity and wind as StatCards; the advisory banner is
 * the tap target into /weather. Owns its loading/error states (§8.2).
 */
export function WeatherNow({ status, weather, onRetry }) {
  const { t, lang } = useT();

  if (status === 'success' && !weather?.current) {
    return null;
  }

  const advisory = weather?.advisories?.[0];
  const advisoryTone = (advisory && (ADVISORY_TONES[advisory.tone] ?? ADVISORY_TONES.info)) || null;
  const AdvisoryIcon = advisoryTone?.Icon;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t('home.weatherNow')}
        action={
          <Link to="/weather" className={sectionLinkClass}>
            {t('home.viewForecast')}
          </Link>
        }
      />
      {status === 'loading' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      )}
      {status === 'error' && (
        <ErrorState compact message={t('home.weatherError')} onRetry={onRetry} />
      )}
      {status === 'success' && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={ThermometerIcon}
              label={t('home.tempLabel')}
              value={formatNumber(weather.current.temperature_c, lang)}
              unit="°C"
              tone="sky"
            />
            <StatCard
              icon={CloudRainIcon}
              label={t('home.rainChanceLabel')}
              value={formatNumber(weather.current.rain_chance_pct, lang)}
              unit={t('home.unitPercent')}
              tone="sky"
            />
            <StatCard
              icon={DropletIcon}
              label={t('home.humidityLabel')}
              value={formatNumber(weather.current.humidity_pct, lang)}
              unit={t('home.unitPercent')}
              tone="teal"
            />
            <StatCard
              icon={WindIcon}
              label={t('home.windLabel')}
              value={formatNumber(weather.current.wind_kmh, lang)}
              unit={t('home.unitKmh')}
              tone="sky"
            />
          </div>
          {advisory && advisoryTone && AdvisoryIcon && (
            <Link
              to="/weather"
              className={cn(
                'flex min-h-11 items-center justify-between gap-3 rounded-lg border-s-4 p-3 text-sm font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2',
                advisoryTone.wrap,
              )}
            >
              <span className="flex items-start gap-2.5">
                <AdvisoryIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{advisory.text}</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 rtl:-scale-x-100" />
            </Link>
          )}
        </>
      )}
    </section>
  );
}
