const ICON_STYLES = {
  sunny: { className: 'text-sun-600 dark:text-sun-400', label: 'Sunny' },
  'partly-cloudy': { className: 'text-sun-600 dark:text-sun-400', label: 'Partly cloudy' },
  cloudy: { className: 'text-sky-600 dark:text-sky-400', label: 'Cloudy' },
  rain: { className: 'text-sky-600 dark:text-sky-400', label: 'Rain' },
  thunderstorm: { className: 'text-sky-700 dark:text-sky-300', label: 'Thunderstorm' },
  snow: { className: 'text-sky-400 dark:text-sky-300', label: 'Snow' },
  fog: { className: 'text-soil-500 dark:text-soil-400', label: 'Fog' },
};

export function WeatherIcon({ type = 'partly-cloudy', className = 'h-10 w-10' }) {
  const style = ICON_STYLES[type] ?? ICON_STYLES['partly-cloudy'];
  const showSun = type === 'sunny' || type === 'partly-cloudy';
  const showCloud = type !== 'sunny';
  const showRain = type === 'rain' || type === 'thunderstorm';
  const showSnow = type === 'snow';
  const showLightning = type === 'thunderstorm';
  const showFog = type === 'fog';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={style.label}
      className={`${style.className} ${className}`}
    >
      {showSun && (
        <>
          <circle cx="18" cy="18" r="6" fill="currentColor" fillOpacity="0.16" />
          <path d="M18 5v3M18 28v3M5 18h3M28 18h3M8.8 8.8l2.1 2.1M25.1 25.1l2.1 2.1M27.2 8.8l-2.1 2.1M10.9 25.1l-2.1 2.1" />
        </>
      )}
      {showCloud && (
        <path
          d="M14 35h20.5a7.5 7.5 0 0 0 .5-15 10.5 10.5 0 0 0-20.1 2.7A6.2 6.2 0 0 0 14 35Z"
          fill="currentColor"
          fillOpacity="0.12"
        />
      )}
      {showRain && <path d="M20 38v4M28 38v4M36 38v4" />}
      {showLightning && <path d="M24 36l-2 5 4-1-2 5" />}
      {showSnow && <path d="M20 38v4M28 38v4M36 38v4M22 40h0M30 40h0M34 40h0" />}
      {showFog && <path d="M12 38h24M14 42h20" />}
    </svg>
  );
}
