import { useId } from 'react';
import { cn } from '../../lib/cn';
import { FieldLabel, FieldMessages } from './fieldParts';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

const CONTROL_BASE = [
  'w-full appearance-none border bg-surface px-3 text-base text-soil-900',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

const CONTROL_VALID = 'border-soil-200 dark:border-soil-300 focus:border-field-500 focus:ring-field-500/20';
const CONTROL_INVALID = 'border-rust-500 focus:border-rust-500 focus:ring-rust-500/20';

/** Height + corner treatment: standard field vs the taller auth pill (mirrors TextField). */
const pillClasses = (pill) => (pill ? 'h-12 rounded-full px-5' : 'h-11 rounded-md');

/**
 * Native select with the shared field anatomy (frontend-spec.md §10.1).
 * Native semantics keep keyboard and screen-reader behavior for free;
 * `options` accepts `{ value, label }` objects or plain strings.
 * `placeholder` renders a leading empty option ("Please choose…") when provided.
 * `pill` switches to the fully-rounded auth treatment; `inputClassName` lets
 * consumers extend the control (both additive — default rendering is unchanged).
 */
export function SelectField({
  label,
  required = false,
  hint,
  error,
  options = [],
  placeholder,
  id,
  className,
  inputClassName,
  pill = false,
  ...props
}) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <FieldLabel htmlFor={selectId} label={label} required={required} />
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            pillClasses(pill),
            'pe-9',
            error ? CONTROL_INVALID : CONTROL_VALID,
            inputClassName,
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const text = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
        <ChevronDownIcon
          className={cn(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-soil-400',
            pill ? 'end-5' : 'end-3',
          )}
        />
      </div>
      <FieldMessages hintId={hintId} hint={hint} errorId={errorId} error={error} />
    </div>
  );
}
