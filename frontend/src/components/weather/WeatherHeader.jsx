import { ChevronDownIcon } from '../ui/icons/ChevronDownIcon';
import { cn } from '../../lib/cn';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { DISTRICTS, districtName } from '../../lib/districts';

export function WeatherHeader({ location, date, onLocationChange, lang = 'en' }) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1
          tabIndex={-1}
          className="font-display text-2xl font-semibold tracking-tight text-soil-900 focus:outline-none md:text-3xl"
        >
          Weather
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-soil-600">Plan your day with a clear view of the conditions ahead.</p>
      </div>
      <div className="w-full md:w-auto">
        <label htmlFor="weather-location" className="mb-1.5 block text-xs font-medium text-soil-600">
          Forecast location
        </label>
        <div className="relative flex items-center">
          <MapPinIcon className="pointer-events-none absolute start-3 h-4 w-4 text-field-700 dark:text-field-400" />
          <select
            id="weather-location"
            value={location}
            onChange={(event) => onLocationChange?.(event.target.value)}
            className={cn(
              'h-11 w-full appearance-none rounded-md border border-soil-300 bg-surface ps-9 pe-10 text-sm font-medium text-soil-800',
              'transition-colors duration-150 focus:border-field-600 focus:outline-none focus:ring-2 focus:ring-field-600/20 md:w-64',
            )}
          >
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>{districtName(d, lang)}</option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute end-3 h-4 w-4 text-soil-500" />
        </div>
        {date && <p className="mt-1.5 text-xs text-soil-500">Updated {date}</p>}
      </div>
    </header>
  );
}
