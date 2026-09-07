import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';
import { SproutIcon } from '../ui/icons/SproutIcon';

const STAGE_KEYS = ['assistant.checkingStage', 'assistant.readingStage'];
const STAGE_INTERVAL_MS = 1300;

/**
 * Pending assistant bubble (frontend-spec.md §6.3): three pulsing dots plus
 * staged context text instead of a bare spinner. The announcement for screen
 * readers is the page-level live region, so the dots are decorative.
 */
export function TypingIndicator() {
  const { t } = useT();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGE_KEYS.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-field-600 text-white"
      >
        <SproutIcon className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-2.5 rounded-xl border border-soil-200 bg-surface px-4 py-3 shadow-card">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 animate-pulse rounded-full bg-field-500 motion-reduce:animate-none" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-field-500 [animation-delay:150ms] motion-reduce:animate-none" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-field-500 [animation-delay:300ms] motion-reduce:animate-none" />
        </span>
        <span className="text-sm text-soil-500">{t(STAGE_KEYS[stage])}</span>
      </div>
    </li>
  );
}
