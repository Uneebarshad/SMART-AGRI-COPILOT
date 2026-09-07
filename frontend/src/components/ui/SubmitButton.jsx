import { useT } from '../../i18n/useT';
import { Button } from './Button';
import { SpinnerIcon } from './icons/SpinnerIcon';

/**
 * Pending-aware submit (frontend-spec.md §10.1): swaps the label for a
 * spinner + pending text, keeps its size, and stays disabled while working.
 * `aria-busy` announces the in-flight state to assistive tech.
 */
export function SubmitButton({ isSubmitting = false, pendingLabel, children, ...props }) {
  const { t } = useT();
  const label = pendingLabel ?? t('common.saving');

  return (
    <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} {...props}>
      {isSubmitting ? (
        <>
          <SpinnerIcon className="h-4 w-4 animate-spin" />
          <span>{label}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
