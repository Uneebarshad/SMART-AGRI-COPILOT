import { useCallback } from 'react';
import { useT } from '../i18n/useT';
import { useApi } from './useApi';
import { fetchWeather } from '../services/api';

/**
 * Map a backend condition category (snake_case) to the WeatherIcon type
 * (kebab-case) used throughout the weather components.
 */
export function conditionToIconType(condition) {
  switch (condition) {
    case 'clear':
      return 'sunny';
    case 'partly_cloudy':
      return 'partly-cloudy';
    case 'cloudy':
      return 'cloudy';
    case 'rain':
      return 'rain';
    case 'thunderstorm':
      return 'thunderstorm';
    case 'snow':
      return 'snow';
    case 'fog':
      return 'fog';
    default:
      return 'cloudy';
  }
}

/**
 * Format an ISO timestamp into a short local time (e.g. "8:42 AM").
 * Returns '' when the input is missing or unparseable.
 */
function formatUpdated(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Map the backend daily forecast item into the shape DailyForecast expects.
 * `index` 0 → "Today"; otherwise short weekday name.
 */
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function mapDailyItem(item, index) {
  const dateObj = item.date ? new Date(item.date + 'T00:00:00') : null;
  const dayLabel = index === 0
    ? 'Today'
    : dateObj
      ? SHORT_DAYS[dateObj.getDay()]
      : '';
  const dateLabel = dateObj
    ? `${dateObj.getDate()} ${SHORT_MONTHS[dateObj.getMonth()]}`
    : item.date ?? '';

  return {
    day: dayLabel,
    date: dateLabel,
    condition: item.condition_text || item.condition || '',
    high: item.max_temperature ?? 0,
    low: item.min_temperature ?? 0,
    precipitation: item.precipitation_chance ?? 0,
    icon: conditionToIconType(item.condition),
  };
}

/**
 * Map a backend hourly item into the shape HourlyForecast expects.
 */
function mapHourlyItem(item) {
  return {
    time: item.time || '',
    temperature: item.temperature ?? 0,
    precipitation: item.precipitation_chance ?? 0,
    icon: conditionToIconType(item.condition),
  };
}

/**
 * Advisory type → FarmingInsightCard icon key.
 */
const ADVISORY_ICON_MAP = {
  heat_stress: 'droplet',
  cold_caution: 'droplet',
  rain_caution: 'cloud-rain',
  wind_caution: 'wind',
  fungal_risk: 'sprout',
  good_fieldwork: 'sprout',
};

/**
 * Advisory type → short timing hint shown below the description.
 */
const ADVISORY_TIMING = {
  heat_stress: 'Avoid midday',
  cold_caution: 'Check overnight',
  rain_caution: 'Before rain',
  wind_caution: 'Delay spraying',
  fungal_risk: 'Monitor crops',
  good_fieldwork: 'Good window',
};

/**
 * Map a backend advisory into the shape FarmingInsightCard expects.
 * Resolves the localised text for the active language.
 */
function mapAdvisory(advisory, lang) {
  const textLocalized = advisory.text_localized || {};
  const text = textLocalized[lang] ?? textLocalized.en ?? '';

  return {
    title: advisory.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: text,
    timing: ADVISORY_TIMING[advisory.type] ?? '',
    icon: ADVISORY_ICON_MAP[advisory.type] ?? 'sprout',
    tone: advisory.tone ?? 'info',
  };
}

/**
 * Weather data hook: fetches real forecast from GET /api/weather and reshapes
 * the response into the shapes the existing weather components expect.
 * Refetches when district or language changes.
 */
export function useWeather(district) {
  const { lang } = useT();

  const fetcher = useCallback(() => {
    if (!district) return Promise.reject(new Error('No district selected'));
    return fetchWeather(district, lang);
  }, [district, lang]);

  const api = useApi(fetcher);

  // Reshape the raw backend payload into component-friendly shapes.
  const weather = api.data ? reshapeWeather(api.data, lang) : null;

  return { ...api, data: weather };
}

/**
 * Transform the raw backend weather response into the shape consumed by
 * WeatherPage and its child components.
 */
function reshapeWeather(raw, lang) {
  const current = raw.current
    ? {
        temperature: raw.current.temperature ?? 0,
        condition: raw.current.condition_text || raw.current.condition || '',
        icon: conditionToIconType(raw.current.condition),
        feelsLike: raw.current.feels_like ?? 0,
        humidity: raw.current.humidity ?? 0,
        wind: `${raw.current.wind_speed ?? 0} km/h`,
        windSpeed: raw.current.wind_speed ?? 0,
        windDirection: raw.current.wind_direction ?? '',
        precipitation: raw.current.precipitation_chance ?? 0,
        precipitationMm: raw.current.precipitation ?? 0,
        visibility: `${raw.current.visibility ?? 0} km`,
        pressure: raw.current.pressure ?? 0,
        cloudCover: raw.current.cloud_cover ?? 0,
        uvIndex: raw.current.uv_index ?? 0,
        updated: formatUpdated(raw.updated_at),
      }
    : null;

  const hourly = Array.isArray(raw.hourly) ? raw.hourly.map(mapHourlyItem) : [];
  const daily = Array.isArray(raw.daily) ? raw.daily.map(mapDailyItem) : [];
  const advisories = Array.isArray(raw.advisories) ? raw.advisories.map((a) => mapAdvisory(a, lang)) : [];

  // Build weather metrics from real data
  const metrics = current
    ? [
        {
          label: 'Humidity',
          value: `${current.humidity}%`,
          detail: current.humidity >= 70 ? 'High moisture' : current.humidity <= 30 ? 'Dry air' : 'Comfortable for crops',
          icon: 'droplet',
          tone: 'sky',
        },
        {
          label: 'Wind',
          value: current.wind,
          detail: current.windDirection ? `From the ${current.windDirection}` : 'Calm conditions',
          icon: 'wind',
          tone: 'field',
        },
        {
          label: 'Rain chance',
          value: `${current.precipitation}%`,
          detail: current.precipitation >= 40 ? 'Expect rain' : 'Mostly dry',
          icon: 'cloud-rain',
          tone: 'sky',
        },
        {
          label: 'UV index',
          value: `${current.uvIndex}`,
          detail: current.uvIndex >= 8 ? 'Very high — protect yourself' : current.uvIndex >= 6 ? 'High — use sun protection' : 'Moderate',
          icon: 'sun',
          tone: 'sun',
        },
      ]
    : [];

  return {
    district: raw.district || '',
    districtId: raw.district_id || '',
    current,
    hourly,
    daily,
    advisories,
    metrics,
    forecastDaysAvailable: raw.forecast_days_available ?? daily.length,
    forecastDaysLimit: raw.forecast_days_limit ?? 3,
    updatedAt: raw.updated_at || '',
  };
}
