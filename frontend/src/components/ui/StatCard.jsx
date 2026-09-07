import { cn } from '../../lib/cn';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';

const TREND_TONES = {
  positive: 'text-field-700 dark:text-field-400',
  negative: 'text-rust-700 dark:text-rust-400',
  neutral: 'text-soil-500',
};

/**
 * Semantic icon-tile tones (design-system.md): the card stays a neutral
 * surface — color only enters through the icon. Field/leaf = agriculture,
 * teal = water, sky = weather, ai = assistant, sun = warning, rust = risk.
 */
const TILE_TONES = {
  field: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400',
  leaf: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-900/20 dark:text-leaf-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  sun: 'bg-sun-100 text-sun-700 dark:bg-sun-900/20 dark:text-sun-400',
  rust: 'bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400',
  ai: 'bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400',
  neutral: 'bg-soil-100 text-soil-600 dark:bg-soil-200 dark:text-soil-400',
};

/**
 * Metric tile (design-system.md): icon tile top-start, label, value
 * with unit, optional trend row. `trendTone` is a prop, not a guess —
 * moisture up may be good, pest count up is not; the page decides.
 * `tone` gives the icon its semantic color; the card body stays neutral.
 */
export function StatCard({ icon: Icon, label, value, unit, trend, trendTone = 'neutral', tone = 'field', className }) {
  return (
    <div className={cn('rounded-xl border border-soil-200 bg-surface p-4 shadow-card md:p-5', className)}>
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TILE_TONES[tone] ?? TILE_TONES.field)}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {trend && (
          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', TREND_TONES[trendTone])}>
            {trend.direction === 'up' ? (
              <ArrowUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownIcon className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-soil-500">{label}</p>
      <p className="font-display text-2xl font-semibold tracking-tight text-soil-900">
        {value}
        {unit && <span className="ms-1 text-sm font-normal text-soil-500">{unit}</span>}
      </p>
    </div>
  );
}
