import { useT } from '../../i18n/useT';
import { DISTRICTS, districtName } from '../../lib/districts';
import { formatDate } from '../../lib/format';
import { MapPinIcon } from '../ui/icons/MapPinIcon';

function greetingKey(date) {
  const hour = date.getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

/**
 * Time-of-day greeting, localized date and the farmer's district
 * (frontend-spec.md §8.1 widget 1) — AppSettings data, no request.
 */
export function GreetingHeader({ district }) {
  const { t, lang } = useT();
  const now = new Date();
  const districtEntry = DISTRICTS.find((entry) => entry.id === district);

  return (
    <header className="rounded-xl border border-soil-200 dark:border-soil-200 bg-surface p-5 md:p-6 shadow-card">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-soil-500">
        <span>{formatDate(now, lang)}</span>
        {districtEntry && (
          <span className="flex items-center gap-1">
            <span aria-hidden="true">·</span>
            <MapPinIcon className="h-4 w-4 text-field-600 dark:text-field-400" />
            {districtName(districtEntry, lang)}
          </span>
        )}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-soil-900 md:text-3xl">
        {t(greetingKey(now))}
      </h1>
    </header>
  );
}
