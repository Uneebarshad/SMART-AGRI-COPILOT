import { useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn';
import { XIcon } from '../ui/icons/XIcon';

function focusableIn(panel) {
  if (!panel) return [];
  return [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
}

export function FieldDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  centered = false,
  panelClassName,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeButtonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    focusableIn(panelRef.current)[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableIn(panelRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-hidden={false}>
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40 dark:bg-black/50"
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          centered
            ? 'absolute inset-x-4 top-1/2 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-xl bg-surface shadow-raised sm:inset-x-auto sm:start-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2'
            : 'absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-2xl bg-surface shadow-raised md:inset-y-0 md:end-0 md:start-auto md:w-96 md:max-h-none md:rounded-none md:rounded-s-2xl',
          panelClassName,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-soil-200 p-5 md:p-6">
          <div>
            <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-soil-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-soil-600">{description}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-soil-600 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 dark:hover:bg-white/5"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>
        <div className={cn('overflow-y-auto p-5 md:p-6', !centered && 'flex-1')}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 p-5 md:p-6">{footer}</footer>}
      </section>
    </div>
  );
}
