import { cn } from '../../lib/cn';

/** Shared link styling for section-header actions ("View all", …). */
export const sectionLinkClass =
  'font-medium text-field-700 dark:text-field-400 transition-colors duration-150 hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2 rounded-sm';

/**
 * Page-section heading for dashboard widgets with an optional action.
 */
export function SectionHeader({ title, action, className, id }) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <h2 id={id} className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
        {title}
      </h2>
      {action && <div className="pb-0.5 text-sm">{action}</div>}
    </div>
  );
}
