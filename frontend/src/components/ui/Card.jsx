import { cn } from '../../lib/cn';

const FRAME = 'rounded-xl border border-soil-200 bg-surface shadow-card';

/**
 * Surface container (design-system.md): white card, 1px soil border,
 * resting shadow. Only cards with an `onClick` get hover treatment and
 * focus semantics — they render as a real `<button>` so they stay
 * keyboard-operable; static cards stay plain `<div>`s.
 */
export function Card({ onClick, type = 'button', className, children, ...props }) {
  if (onClick) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={cn(
          FRAME,
          'block w-full p-4 text-start transition-[border-color,box-shadow] duration-150',
          'hover:border-soil-300 dark:hover:border-soil-300 hover:shadow-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 focus-visible:ring-offset-2',
          'md:p-5',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cn(FRAME, 'p-4 md:p-5', className)} {...props}>
      {children}
    </div>
  );
}

/** Card top row: Inter semibold card title + optional action. */
export function CardHeader({ title, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <h3 className="text-base font-semibold text-soil-900">{title}</h3>
      {action && <div className="shrink-0 text-sm">{action}</div>}
    </div>
  );
}

/** Card bottom row: separated by a subtle divider (design-system.md). */
export function CardFooter({ className, children }) {
  return (
    <div className={cn('mt-4 flex flex-wrap items-center gap-3 border-t border-soil-100 pt-3', className)}>
      {children}
    </div>
  );
}
