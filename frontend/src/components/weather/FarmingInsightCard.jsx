import { Card } from '../ui';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { WindIcon } from '../ui/icons/WindIcon';

const ICONS = {
  sprout: SproutIcon,
  droplet: DropletIcon,
  'cloud-rain': CloudRainIcon,
  wind: WindIcon,
};

const TONES = {
  success: {
    icon: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400',
    accent: 'border-field-200 dark:border-field-500/30',
  },
  warning: {
    icon: 'bg-sun-100 text-sun-700 dark:bg-sun-900/20 dark:text-sun-400',
    accent: 'border-sun-200 dark:border-sun-500/30',
  },
  info: {
    icon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
    accent: 'border-sky-200 dark:border-sky-500/30',
  },
};

export function FarmingInsightCard({ title, description, timing, icon, tone = 'success' }) {
  const Icon = ICONS[icon] ?? SproutIcon;
  const colors = TONES[tone] ?? TONES.success;

  return (
    <Card className={`border-s-4 ${colors.accent} p-4 md:p-5`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-soil-900">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-soil-600">{description}</p>
          <p className="mt-3 text-xs font-medium text-soil-500">{timing}</p>
        </div>
      </div>
    </Card>
  );
}
