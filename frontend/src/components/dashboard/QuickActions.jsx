import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { SectionHeader } from './SectionHeader';

const ACTIONS = [
  { to: '/assistant', icon: ChatIcon, labelKey: 'home.askAssistant', tone: 'ai' },
  { to: '/diagnosis', icon: LeafIcon, labelKey: 'home.scanLeaf', tone: 'field' },
  { to: '/crop-recommendation', icon: SproutIcon, labelKey: 'home.whatToPlant', tone: 'sun' },
  { to: '/weather', icon: CloudRainIcon, labelKey: 'home.seeWeather', tone: 'sky' },
];

const ACTION_TONES = {
  field: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400',
  sun: 'bg-sun-100 text-sun-700 dark:bg-sun-900/20 dark:text-sun-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
  ai: 'bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400',
};

/**
 * 2×2 grid of labeled icon shortcuts (frontend-spec.md §8.1 widget 3) — the
 * always-present escape hatch so the dashboard is never a dead end (§8.2).
 */
export function QuickActions() {
  const { t } = useT();

  return (
    <section className="flex flex-col gap-4" aria-labelledby="quick-actions-heading">
      <SectionHeader id="quick-actions-heading" title={t('home.quickActions')} />
      <nav aria-label={t('home.quickActions')} className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ to, icon: Icon, labelKey, tone }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-[72px] items-center gap-3 rounded-xl border border-soil-200 bg-surface p-3 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-soil-300 dark:hover:border-soil-300 dark:hover:bg-white/[0.03] hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 sm:p-4"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${ACTION_TONES[tone]}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-soil-900">{t(labelKey)}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
