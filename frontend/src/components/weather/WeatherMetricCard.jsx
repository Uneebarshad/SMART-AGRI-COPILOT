import { Card } from '../ui';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { SunMetricIcon } from './SunMetricIcon';
import { WindIcon } from '../ui/icons/WindIcon';

const ICONS = {
  droplet: DropletIcon,
  wind: WindIcon,
  'cloud-rain': CloudRainIcon,
  sun: SunMetricIcon,
};

const TONES = {
  field: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  sun: 'bg-sun-100 text-sun-700 dark:bg-sun-900/20 dark:text-sun-400',
};

export function WeatherMetricCard({ label, value, detail, icon, tone = 'field' }) {
  const Icon = ICONS[icon] ?? DropletIcon;

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone] ?? TONES.field}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-soil-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-soil-900">{value}</p>
          <p className="mt-1 text-xs text-soil-500">{detail}</p>
        </div>
      </div>
    </Card>
  );
}
