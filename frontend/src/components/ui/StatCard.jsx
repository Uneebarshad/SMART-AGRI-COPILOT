import { cn } from '../../lib/cn';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

const TREND_TONES = {
  positive: 'text-field-700 dark:text-field-400',
  negative: 'text-rust-700 dark:text-rust-400',
  neutral: 'text-soil-500',
};

/**
 * Semantic icon-tile tones (design-system.md): the card stays a neutral
 * surface — color only enters through the icon. In dark mode every tile
 * resolves to the same emerald treatment so the KPI row reads as one
 * coherent component family (reference design).
 */
const TILE_TONES = {
  field: 'bg-field-100 text-field-700',
  leaf: 'bg-leaf-100 text-leaf-700',
  teal: 'bg-teal-100 text-teal-700',
  sky: 'bg-sky-100 text-sky-700',
  sun: 'bg-sun-100 text-sun-700',
  rust: 'bg-rust-100 text-rust-700',
  ai: 'bg-ai-100 text-ai-700',
  neutral: 'bg-soil-100 text-soil-600',
};

const TILE_DARK = 'dark:bg-gradient-to-br dark:from-field-500/25 dark:to-field-600/10 dark:text-field-300 dark:ring-1 dark:ring-inset dark:ring-field-500/25';

/** Faint decorative foliage in the card's trailing corner (reference design). */
function CardLeaf() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-3 -end-2 h-16 w-16 text-field-500/12 dark:text-field-400/15"
    >
      <path d="M52 8C30 10 14 24 12 48c22-2 38-16 40-40Z" fill="currentColor" />
      <path d="M12 48C24 36 36 26 50 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  );
}

/**
 * Metric tile (design-system.md): gradient icon tile top-start, optional
 * trailing chevron, label, large value with unit, optional `sub` caption and
 * trend row. `tone` colors the icon in light mode; dark mode unifies tiles.
 * Hover adds a subtle lift + emerald glow. The card body stays neutral.
 */
export function StatCard({ icon: Icon, label, value, unit, sub, trend, trendTone = 'neutral', tone = 'field', showChevron = false, className }) {
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-soil-200 bg-surface p-4 shadow-card',
        'transition-[transform,border-color,box-shadow] duration-200',
        'hover:-translate-y-0.5 hover:border-field-500/40 hover:shadow-glow',
        'md:p-5',
        className,
      )}
    >
      <CardLeaf />
      <div className="relative z-10 flex items-start justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.04]', TILE_TONES[tone] ?? TILE_TONES.field, TILE_DARK)}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {showChevron && (
          <ChevronRightIcon className="h-4 w-4 text-soil-400 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-soil-500 rtl:-scale-x-100" />
        )}
        {trend && !showChevron && (
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
      <p className="relative z-10 mt-4 text-sm text-soil-500 dark:text-soil-600">{label}</p>
      <p className="relative z-10 font-display text-[26px] font-semibold leading-tight tracking-tight text-soil-900 dark:text-soil-950">
        {value}
        {unit && <span className="ms-1 text-sm font-normal text-soil-500 dark:text-soil-600">{unit}</span>}
      </p>
      {sub && <p className="relative z-10 mt-0.5 line-clamp-1 text-xs text-soil-500 dark:text-soil-500">{sub}</p>}
    </div>
  );
}
