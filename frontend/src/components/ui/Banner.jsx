import { cn } from '../../lib/cn';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { InfoIcon } from './icons/InfoIcon';

const TONES = {
  success: { wrap: 'border-field-600 bg-field-50 text-field-800 dark:border-field-500/40 dark:bg-field-900/15 dark:text-field-400', Icon: CheckCircleIcon },
  error: { wrap: 'border-rust-600 bg-rust-50 text-rust-800 dark:border-rust-500/40 dark:bg-rust-900/15 dark:text-rust-400', Icon: AlertTriangleIcon },
  warning: { wrap: 'border-sun-600 bg-sun-50 text-sun-800 dark:border-sun-500/40 dark:bg-sun-900/15 dark:text-sun-400', Icon: AlertTriangleIcon },
  info: { wrap: 'border-sky-600 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-900/15 dark:text-sky-400', Icon: InfoIcon },
};

/**
 * Inline feedback banner (frontend-spec.md §10.1): tone-tinted surface with a
 * start-side accent bar (`border-s-4` stays on the correct side in RTL).
 * Errors announce assertively (`role="alert"`); the rest are polite statuses.
 */
export function Banner({ tone = 'info', className, children }) {
  const { wrap, Icon } = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-lg border-s-4 p-3 text-sm', wrap, className)}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
