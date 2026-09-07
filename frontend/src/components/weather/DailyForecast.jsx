import { Card, CardHeader } from '../ui';
import { WeatherIcon } from './WeatherIcon';

export function DailyForecast({ items, forecastDaysAvailable, forecastDaysLimit }) {
  const title = `${items.length}-day forecast`;
  const planNote = forecastDaysLimit
    ? `${forecastDaysLimit}-day forecast available on the current weather plan.`
    : null;

  return (
    <section aria-labelledby="daily-forecast-title">
      <Card>
        <CardHeader title={title} action={<span className="text-xs text-soil-500">High / low</span>} />
        <div className="divide-y divide-soil-100 dark:divide-soil-200">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-soil-500">No forecast data available.</p>
          ) : (
            items.map((item) => (
              <div key={item.date} className="flex min-h-14 items-center gap-2 py-3 first:pt-0 last:pb-0 sm:gap-3">
                <div className="w-16 shrink-0">
                  <p className="text-sm font-semibold text-soil-900">{item.day}</p>
                  <p className="mt-0.5 text-xs text-soil-500">{item.date}</p>
                </div>
                <WeatherIcon type={item.icon} className="h-8 w-8 shrink-0" />
                <p className="min-w-0 flex-1 truncate text-xs text-soil-600 sm:text-sm">{item.condition}</p>
                <p className="w-12 shrink-0 text-right text-sm font-semibold text-soil-900">{item.high}°</p>
                <p className="w-12 shrink-0 text-right text-sm text-soil-500">{item.low}°</p>
                <p className="w-12 shrink-0 text-right text-xs font-medium text-sky-700">{item.precipitation}%</p>
              </div>
            ))
          )}
        </div>
        {planNote && (
          <p className="mt-3 border-t border-soil-100 dark:border-soil-200 pt-3 text-xs text-soil-500">{planNote}</p>
        )}
      </Card>
    </section>
  );
}
