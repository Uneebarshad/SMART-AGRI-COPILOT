import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

/**
 * Human-readable failure surface with retry (five-state rule,
 * frontend-spec.md §18.2): same anatomy as EmptyState in rust tones.
 * `compact` shrinks the block for widget-level errors (§8.2).
 */
export function ErrorState({ title, message, onRetry, retryLabel, compact = false }) {
  const { t } = useT();

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-6' : 'py-12')}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-rust-100 text-rust-600',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}
      >
        <AlertTriangleIcon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-soil-800">
        {title ?? t('common.somethingWrong')}
      </h3>
      {message && <p className="mt-1 max-w-sm text-sm text-soil-500">{message}</p>}
      {onRetry && (
        <Button variant="outline" size={compact ? 'sm' : 'md'} className="mt-5" onClick={onRetry}>
          {retryLabel ?? t('common.tryAgain')}
        </Button>
      )}
    </div>
  );
}
