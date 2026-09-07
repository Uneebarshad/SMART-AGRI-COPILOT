import { Card, CardHeader } from '../ui';
import { WeatherIcon } from './WeatherIcon';

const MAX_HOURLY_TILES = 12;

export function HourlyForecast({ items }) {
  const visible = items.slice(0, MAX_HOURLY_TILES);

  return (
    <section aria-labelledby="hourly-forecast-title">
      <Card>
        <CardHeader title="Hourly forecast" action={<span className="text-xs text-soil-500">Next {visible.length} hours</span>} />
        {visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-soil-500">No hourly data available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {visible.map((item) => (
              <div
                key={item.time}
                className="flex min-w-0 flex-col items-center rounded-lg border border-soil-100 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 px-2 py-3 first:border-field-200 first:bg-field-50 dark:first:border-field-500/30 dark:first:bg-field-900/15"
              >
                <p className="text-xs font-medium text-soil-600">{item.time}</p>
                <WeatherIcon type={item.icon} className="my-3 h-8 w-8" />
                <p className="font-display text-xl font-semibold text-soil-900">{item.temperature}°</p>
                <p className="mt-2 text-xs font-medium text-sky-700">{item.precipitation}% rain</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
