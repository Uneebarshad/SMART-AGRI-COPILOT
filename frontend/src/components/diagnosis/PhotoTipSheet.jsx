import { useState } from 'react';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { ChevronDownIcon } from '../ui/icons/ChevronDownIcon';
import { InfoIcon } from '../ui/icons/InfoIcon';

const TIP_KEYS = ['diagnosis.tip1', 'diagnosis.tip2', 'diagnosis.tip3'];

/**
 * Collapsible capture-quality tips (frontend-spec.md §7.1): "One leaf fills the
 * frame · natural daylight · avoid blur" — photo quality materially affects
 * diagnosis quality, so the sheet sits with the capture area.
 */
export function PhotoTipSheet() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-2 pe-2 dark:border-sky-500/30 dark:bg-sky-900/15">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="photo-tips-list"
        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-start text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/25"
      >
        <InfoIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{t('diagnosis.tipSheetTitle')}</span>
        <ChevronDownIcon
          className={cn('h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <ul id="photo-tips-list" className="flex flex-col gap-1.5 px-3 pb-2 pt-1">
          {TIP_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2 text-sm text-sky-900 dark:text-sky-300">
              <CheckCircleIcon className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-400" />
              {t(key)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
