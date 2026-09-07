import { useId } from 'react';
import { cn } from '../../lib/cn';
import { FieldLabel, FieldMessages } from './fieldParts';

const CONTROL_BASE = [
  'h-11 w-full rounded-md border bg-surface px-3 text-base text-soil-900',
  'transition-colors duration-150 placeholder:text-soil-400',
  'focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const CONTROL_VALID = 'border-soil-200 dark:border-soil-300 focus:border-field-500 focus:ring-field-500/20';
const CONTROL_INVALID = 'border-rust-500 focus:border-rust-500 focus:ring-rust-500/20';

/**
 * Single-line input with the full field anatomy (frontend-spec.md §10.1):
 * label, required marker, hint, and error with aria wiring. Invalid state
 * swaps the field accent for rust. 16px text suppresses mobile zoom-on-focus.
 */
export function TextField({ label, required = false, hint, error, id, className, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL_BASE, error ? CONTROL_INVALID : CONTROL_VALID)}
        {...props}
      />
      <FieldMessages hintId={hintId} hint={hint} errorId={errorId} error={error} />
    </div>
  );
}
