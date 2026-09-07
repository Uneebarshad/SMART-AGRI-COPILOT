import { Card } from '../ui';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { ThermometerIcon } from '../ui/icons/ThermometerIcon';
import { WindIcon } from '../ui/icons/WindIcon';
import { WeatherIcon } from './WeatherIcon';
import { RefreshIcon } from '../ui/icons/RefreshIcon';

/**
 * Detail tiles follow the shared semantic palette: temperature/precipitation
 * = blue, humidity = teal, wind = blue, general = neutral. The card itself
 * stays a neutral surface — color only enters through the icons.
 */
const DETAIL_TONES = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  neutral: 'bg-soil-100 text-soil-600 dark:bg-soil-200 dark:text-soil-400',
};

function Detail({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className="flex items-center gap-3 border-b border-soil-100 dark:border-soil-200 py-3 last:border-b-0 sm:border-b-0 sm:border-e sm:border-soil-200 sm:px-4 sm:first:ps-0 sm:last:border-e-0 sm:last:pe-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${DETAIL_TONES[tone] ?? DETAIL_TONES.neutral}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-soil-500">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-soil-900">{value}</p>
      </div>
    </div>
  );
}

export function CurrentWeatherCard({ location, current, onRefresh, refreshing = false }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-soil-900">
              <MapPinIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              {location}
            </p>
            <p className="mt-1 text-xs text-soil-500">Current conditions</p>
          </div>
          <WeatherIcon type={current.icon} className="h-14 w-14" />
        </div>
        <div className="mt-5 flex items-end gap-3">
          <p className="font-display text-6xl font-semibold tracking-tight text-soil-900">{current.temperature}°</p>
          <div className="pb-2">
            <p className="text-sm font-medium text-soil-900">{current.condition}</p>
            <p className="mt-1 text-xs text-soil-500">Feels like {current.feelsLike}°</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-soil-500">Updated today at {current.updated}</p>
      </div>
      <div className="border-t border-soil-100 dark:border-soil-200 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-soil-900">Today at a glance</p>
            <p className="mt-1 text-xs text-soil-500">Helpful details for your next field check.</p>
          </div>
          <button
            type="button"
            aria-label="Refresh weather"
            aria-busy={refreshing}
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-soil-200 dark:border-soil-300 bg-surface px-3 text-sm font-medium text-soil-700 dark:text-soil-600 transition-colors duration-150 hover:bg-soil-50 dark:hover:bg-soil-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshIcon className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="mt-5 grid sm:grid-cols-2">
          <Detail icon={ThermometerIcon} label="Feels like" value={`${current.feelsLike}°C`} tone="sky" />
          <Detail icon={DropletIcon} label="Humidity" value={`${current.humidity}%`} tone="teal" />
          <Detail icon={WindIcon} label="Wind" value={current.wind} tone="sky" />
          <Detail icon={DropletIcon} label="Precipitation" value={`${current.precipitation}%`} tone="sky" />
          <Detail icon={MapPinIcon} label="Visibility" value={current.visibility} tone="neutral" />
        </div>
      </div>
    </Card>
  );
}
