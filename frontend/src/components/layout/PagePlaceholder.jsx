import { useT } from '../../i18n/useT';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PageHeader } from './PageHeader';
import { InfoIcon } from '../ui/icons/InfoIcon';

/**
 * Lightweight scaffold for routes whose feature UI arrives in later
 * implementation steps (frontend-spec.md §4.6). Renders a real, translated,
 * titled page with an explicit "not built yet" notice — no dead links.
 */
export function PagePlaceholder({ titleKey, subtitleKey }) {
  const { t } = useT();
  const title = t(titleKey);
  usePageTitle(title);

  return (
    <div>
      <PageHeader title={title} subtitle={t(subtitleKey)} />
      <div className="rounded-xl border border-dashed border-soil-300 bg-surface p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600"
          >
            <InfoIcon className="h-4 w-4" />
          </span>
          <p className="text-sm text-soil-600">{t('common.placeholderNote')}</p>
        </div>
      </div>
    </div>
  );
}
