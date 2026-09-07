import { useEffect, useState } from 'react';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';

const STAGE_KEYS = ['diagnosis.stageUpload', 'diagnosis.stageAnalyze', 'diagnosis.stageAdvice'];
const STAGE_DURATIONS_MS = [2400, 2400, 2200]; // cosmetic pacing within the fixture delay (§7.3)
const TICK_MS = 1000;

/**
 * Staged analysis state (frontend-spec.md §7.3): a step list progresses
 * "Uploading photo… / Analyzing leaf… / Preparing advice…" with cosmetic
 * elapsed-time labels — no fake percentages, no claimed backend events. Cancel
 * aborts the request; the photo stays for retry. A skeleton result card below
 * mirrors the final layout.
 */
export function AnalysisProgress({ onCancel }) {
  const { t } = useT();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsedMs((value) => value + TICK_MS), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  let stage = 0;
  let consumed = 0;
  for (let index = 0; index < STAGE_DURATIONS_MS.length; index += 1) {
    if (elapsedMs >= consumed + STAGE_DURATIONS_MS[index]) {
      stage = index + 1;
      consumed += STAGE_DURATIONS_MS[index];
    } else {
      break;
    }
  }
  const activeStage = Math.min(stage, STAGE_KEYS.length - 1);
  const stageLabel = t(STAGE_KEYS[activeStage]);

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-1.5" aria-label={stageLabel}>
        {STAGE_KEYS.map((key, index) => {
          const isDone = index < stage;
          const isActive = index === activeStage && stage < STAGE_KEYS.length;
          return (
            <li
              key={key}
              className={cn(
                'flex min-h-11 items-center gap-2.5 px-1 text-sm',
                isDone ? 'text-soil-500' : isActive ? 'font-medium text-soil-900' : 'text-soil-400',
              )}
            >
              {isDone ? (
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-field-600" />
              ) : (
                <span
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    isActive ? 'animate-pulse bg-field-600 motion-reduce:animate-none' : 'bg-soil-300',
                  )}
                  aria-hidden="true"
                />
              )}
              <span>
                {t(key)}
                {isActive && (
                  <span className="ms-1.5 tabular-nums text-soil-500">{`${Math.floor(elapsedMs / 1000)}s`}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {stageLabel}
      </p>
      <div>
        <Button variant="outline" onClick={onCancel}>
          {t('diagnosis.cancel')}
        </Button>
      </div>

      {/* Skeleton result card mirroring the final layout (§7.3). */}
      <div className="rounded-xl border border-soil-200 bg-surface p-4 shadow-card md:p-5" aria-hidden="true">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="mt-2 h-4 w-2/5" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-4 aspect-[4/3] w-full max-w-xs rounded-lg" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
