import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { Badge, Card } from '../ui';
import { BugIcon } from '../ui/icons/BugIcon';
import { ChartIcon } from '../ui/icons/ChartIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';

const CATEGORY_ICONS = {
  water: DropletIcon,
  pest: BugIcon,
  weather: CloudRainIcon,
  soil: SproutIcon,
};

/**
 * Category icon tiles use the shared semantic palette: water = teal,
 * pest = red, weather = blue, soil/crop = green. The card body stays neutral.
 */
const CATEGORY_TONES = {
  water: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  pest: 'bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400',
  weather: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  soil: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400',
};

const CATEGORY_TONE_FALLBACK = 'bg-soil-100 text-soil-600 dark:bg-soil-200 dark:text-soil-400';

/** Priority: high = red, medium = amber, low = green (spec §10). */
const PRIORITY_TONES = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
};

const PRIORITY_LABEL_KEYS = {
  high: 'home.priorityHigh',
  medium: 'home.priorityMedium',
  low: 'home.priorityLow',
};

/**
 * Advice card (frontend-spec.md §10.3): category icon tile, title, preview
 * text and a priority badge. Shared by the dashboard's top-2 slice and the
 * recommendations screen.
 */
export function RecommendationCard({ category = 'general', priority, title, text }) {
  const { t } = useT();
  const Icon = CATEGORY_ICONS[category] ?? ChartIcon;

  return (
    <Card className="flex items-start gap-4">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', CATEGORY_TONES[category] ?? CATEGORY_TONE_FALLBACK)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-soil-900">{title}</p>
          {priority && PRIORITY_TONES[priority] && (
            <Badge tone={PRIORITY_TONES[priority]}>{t(PRIORITY_LABEL_KEYS[priority])}</Badge>
          )}
        </div>
        {text && <p className="mt-1 line-clamp-2 text-sm text-soil-600">{text}</p>}
      </div>
    </Card>
  );
}
