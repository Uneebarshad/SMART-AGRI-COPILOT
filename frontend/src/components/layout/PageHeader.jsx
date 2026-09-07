import { cn } from '../../lib/cn';

export function PageHeader({ title, subtitle, action, eyebrow, className }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-field-700 dark:text-field-400">{eyebrow}</p>
        )}
        {/* tabIndex lets route changes move focus to the page heading (spec §12.3). */}
        <h1
          tabIndex={-1}
          className="font-display text-2xl font-semibold tracking-tight text-soil-900 focus:outline-none md:text-3xl"
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-soil-500">{subtitle}</p>}
      </div>
      {action && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{action}</div>}
    </header>
  );
}
