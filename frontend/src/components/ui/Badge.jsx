import { cn } from '../../lib/cn';

const TONES = {
  success: 'bg-field-100 text-field-800 dark:bg-field-900/20 dark:text-field-400',
  warning: 'bg-sun-100 text-sun-800 dark:bg-sun-900/20 dark:text-sun-400',
  danger: 'bg-rust-100 text-rust-800 dark:bg-rust-900/20 dark:text-rust-400',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400',
  neutral: 'bg-soil-100 text-soil-700 dark:bg-soil-200 dark:text-soil-500',
};

/**
 * Status chip (design-system.md): always a background-tint + dark-text pair
 * from the same family. `dot` marks "live"/sensor states.
 */
export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
