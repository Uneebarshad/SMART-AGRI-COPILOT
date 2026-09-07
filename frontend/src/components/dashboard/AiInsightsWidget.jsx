import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { InfoIcon } from '../ui/icons/InfoIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { BugIcon } from '../ui/icons/BugIcon';

/**
 * Accent colors are semantic per insight type — only the icon tile carries
 * color; the card body stays a neutral dark surface (design-system.md).
 * irrigation = teal (water), crop-health = green, weather = blue,
 * disease = red, action = indigo (AI next step).
 */
const TYPE_CONFIG = {
  irrigation: { Icon: DropletIcon, tile: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' },
  'crop-health': { Icon: LeafIcon, tile: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400' },
  weather: { Icon: CloudRainIcon, tile: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
  disease: { Icon: BugIcon, tile: 'bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400' },
  action: { Icon: SproutIcon, tile: 'bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400' },
};

const FALLBACK_CONFIG = { Icon: InfoIcon, tile: 'bg-soil-100 text-soil-600 dark:bg-soil-200 dark:text-soil-400' };

function InsightCard({ insight }) {
  const { Icon, tile } = TYPE_CONFIG[insight.type] ?? FALLBACK_CONFIG;

  return (
    <li>
      <Link
        to={insight.link}
        className={cn(
          'group flex items-start gap-4 rounded-xl border border-soil-200 bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-150',
          'hover:border-soil-300 dark:hover:border-soil-300 dark:hover:bg-white/[0.03] hover:shadow-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2',
        )}
      >
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tile)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-soil-900">{insight.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-soil-600 line-clamp-2">{insight.description}</p>
        </div>
        <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-soil-400 transition-transform duration-150 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </Link>
    </li>
  );
}

/**
 * AI Insights widget — the visually prominent AI component on the Dashboard.
 * Shows intelligent farming observations derived from field, weather, and scan data.
 */
export function AiInsightsWidget({ insights }) {
  if (!insights?.length) return null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="ai-insights-heading">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ai-600 text-white">
            <SproutIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="ai-insights-heading" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
              AI insights
            </h2>
            <p className="text-xs text-soil-500">Personalized observations for your farm</p>
          </div>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ul>
    </section>
  );
}
