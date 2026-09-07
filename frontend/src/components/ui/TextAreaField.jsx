import { useEffect, useId, useRef } from 'react';
import { cn } from '../../lib/cn';
import { FieldLabel, FieldMessages } from './fieldParts';

const CONTROL_BASE = [
  'min-h-11 w-full resize-none rounded-md border bg-surface px-3 py-2.5 text-base text-soil-900',
  'transition-colors duration-150 placeholder:text-soil-400',
  'focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const CONTROL_VALID = 'border-soil-200 dark:border-soil-300 focus:border-field-500 focus:ring-field-500/20';
const CONTROL_INVALID = 'border-rust-500 focus:border-rust-500 focus:ring-rust-500/20';

/**
 * Multiline input with the shared field anatomy and autosize
 * (frontend-spec.md §10.1): grows with content up to max-h, then scrolls.
 * Never below the 44px minimum target; 16px text suppresses mobile zoom.
 */
export function TextAreaField({
  label,
  required = false,
  hint,
  error,
  rows = 4,
  value,
  id,
  className,
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const textareaRef = useRef(null);

  const autosize = (el) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Keeps external value changes (controlled usage) sized correctly;
  // onInput below covers typing in both controlled and uncontrolled usage.
  useEffect(() => {
    if (textareaRef.current) autosize(textareaRef.current);
  }, [value]);

  return (
    <div className={className}>
      <FieldLabel htmlFor={inputId} label={label} required={required} />
      <textarea
        ref={textareaRef}
        id={inputId}
        rows={rows}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onInput={(event) => autosize(event.currentTarget)}
        className={cn('max-h-64 overflow-y-auto', CONTROL_BASE, error ? CONTROL_INVALID : CONTROL_VALID)}
        {...props}
      />
      <FieldMessages hintId={hintId} hint={hint} errorId={errorId} error={error} />
    </div>
  );
}
