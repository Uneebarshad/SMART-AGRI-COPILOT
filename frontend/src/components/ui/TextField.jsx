import { useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { FieldLabel, FieldMessages } from './fieldParts';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';

const CONTROL_BASE = [
  'w-full border bg-surface px-3 text-base text-soil-900',
  'transition-colors duration-150 placeholder:text-soil-400',
  'focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const CONTROL_VALID = 'border-soil-200 dark:border-soil-300 focus:border-field-500 focus:ring-field-500/20';
const CONTROL_INVALID = 'border-rust-500 focus:border-rust-500 focus:ring-rust-500/20';

/** Height + corner treatment: standard field vs the taller auth pill. */
const pillClasses = (pill) => (pill ? 'h-12 rounded-full px-5' : 'h-11 rounded-md');

/**
 * Password input with a working show/hide toggle. Same field anatomy as
 * TextField (label, required marker, error with aria wiring) plus a trailing
 * icon button that flips `type` between password and text. The toggle is a
 * real control with an accessible name, and the extra end padding keeps the
 * text clear of it in both LTR and RTL.
 */
export function PasswordField({
  label,
  required = false,
  hint,
  error,
  id,
  className,
  inputClassName,
  pill = false,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            pillClasses(pill),
            'pe-12',
            error ? CONTROL_INVALID : CONTROL_VALID,
            inputClassName,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className={cn(
            'absolute inset-y-0 end-0 flex w-11 items-center justify-center text-soil-500 transition-colors hover:text-soil-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
            'dark:text-soil-400 dark:hover:text-soil-600',
            pill && 'rounded-full',
          )}
        >
          {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      <FieldMessages hintId={hintId} hint={hint} errorId={errorId} error={error} />
    </div>
  );
}

/**
 * Single-line input with the full field anatomy (frontend-spec.md §10.1):
 * label, required marker, hint, and error with aria wiring. Invalid state
 * swaps the field accent for rust. 16px text suppresses mobile zoom-on-focus.
 * `pill` switches to the fully-rounded auth treatment; `trailing` renders a
 * decorative adornment (e.g. an icon) inside the control's end edge.
 */
export function TextField({
  label,
  required = false,
  hint,
  error,
  id,
  className,
  inputClassName,
  trailing,
  pill = false,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            pillClasses(pill),
            trailing && 'pe-12',
            error ? CONTROL_INVALID : CONTROL_VALID,
            inputClassName,
          )}
          {...props}
        />
        {trailing && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 flex w-11 items-center justify-center text-soil-400"
          >
            {trailing}
          </span>
        )}
      </div>
      <FieldMessages hintId={hintId} hint={hint} errorId={errorId} error={error} />
    </div>
  );
}
