import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { BoltIcon } from '../ui/icons/BoltIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';

const ACTIONS = [
  { to: '/assistant', icon: ChatIcon, titleKey: 'home.askAssistant', descKey: 'home.askAssistantDesc', tone: 'ai' },
  { to: '/diagnosis', icon: LeafIcon, titleKey: 'home.scanLeaf', descKey: 'home.scanLeafDesc', tone: 'field' },
  { to: '/recommendations', icon: SproutIcon, titleKey: 'home.getRecommendations', descKey: 'home.getRecommendationsDesc', tone: 'sun' },
  { to: '/weather', icon: CloudRainIcon, titleKey: 'home.seeWeather', descKey: 'home.seeWeatherDesc', tone: 'sky' },
];

const ACTION_TONES = {
  field: 'bg-field-100 text-field-700 dark:bg-field-500/15 dark:text-field-300',
  sun: 'bg-sun-100 text-sun-700 dark:bg-sun-500/15 dark:text-sun-400',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  ai: 'bg-ai-100 text-ai-700 dark:bg-ai-500/15 dark:text-ai-400',
};

/**
 * Quick Actions card (reference design): a vertical list of labeled
 * shortcuts with descriptions — the always-present escape hatch so the
 * dashboard is never a dead end (frontend-spec.md §8.2).
 */
export function QuickActions() {
  const { t } = useT();

  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="animate-[fadeIn_0.4s_ease-out] rounded-2xl border border-soil-200 bg-surface shadow-card"
    >
      <h2 id="quick-actions-heading" className="flex items-center gap-2.5 p-5 pb-2 text-base font-semibold text-soil-900 dark:text-soil-950">
        <BoltIcon className="h-5 w-5 text-sun-500 dark:text-sun-400" />
        {t('home.quickActions')}
      </h2>
      <nav aria-label={t('home.quickActions')} className="flex flex-col gap-2.5 px-4 pb-4">
        {ACTIONS.map(({ to, icon: Icon, titleKey, descKey, tone }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'group flex min-h-[64px] items-center gap-3 rounded-xl border border-soil-200 p-3 transition-[border-color,background-color,transform] duration-200',
              'hover:-translate-y-0.5 hover:border-field-500/40 hover:bg-soil-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
              'dark:border-soil-200 dark:hover:bg-field-500/[0.06]',
            )}
          >
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.05]', ACTION_TONES[tone])}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-soil-900 dark:text-soil-950">{t(titleKey)}</span>
              <span className="mt-0.5 block truncate text-xs text-soil-500 dark:text-soil-600">{t(descKey)}</span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-soil-500 rtl:-scale-x-100" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
