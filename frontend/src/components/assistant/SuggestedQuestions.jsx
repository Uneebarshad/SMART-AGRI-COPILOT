import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';

const SUGGESTION_KEYS = [
  'assistant.suggestion1',
  'assistant.suggestion2',
  'assistant.suggestion3',
  'assistant.suggestion4',
];

const QUICK_ACTIONS = [
  { to: '/diagnosis', icon: LeafIcon, labelKey: 'home.scanLeaf' },
  { to: '/weather', icon: CloudRainIcon, labelKey: 'home.seeWeather' },
  { to: '/crop-recommendation', icon: SproutIcon, labelKey: 'home.whatToPlant' },
];

/**
 * Empty-conversation helpers (frontend-spec.md §6.4): four localized
 * suggested questions plus a quick-actions row into the other flows.
 */
export function SuggestedQuestions({ onSuggestion }) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-soil-700">{t('assistant.suggestionsLabel')}</h2>
      <ul className="flex flex-col gap-2.5">
        {SUGGESTION_KEYS.map((key) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSuggestion(t(key))}
              className="min-h-11 w-full rounded-xl border border-soil-200 bg-surface px-4 py-3 text-start text-sm font-medium text-soil-800 shadow-card transition-colors hover:border-soil-300 dark:hover:border-soil-300 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
            >
              {t(key)}
            </button>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-2.5">
        {QUICK_ACTIONS.map(({ to, icon: Icon, labelKey }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex min-h-11 items-center gap-2 rounded-full border border-field-200 bg-field-50 px-4 text-sm font-medium text-field-800 transition-colors hover:bg-field-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 dark:border-field-500/30 dark:bg-field-900/15 dark:text-field-400 dark:hover:bg-field-900/25"
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
