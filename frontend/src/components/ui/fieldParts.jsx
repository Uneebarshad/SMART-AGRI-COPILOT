import { useT } from '../../i18n/useT';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

/**
 * Shared pieces of the form field anatomy (design-system.md):
 * `<label>` (text-sm font-medium soil-800) → control → hint (`text-xs soil-500`)
 * → error (`text-xs rust-700`, icon, `aria-describedby` wired, `aria-invalid` set).
 * Composed by TextField, SelectField and TextAreaField — keep the three in
 * sync through these parts instead of duplicating the anatomy.
 */
export function FieldLabel({ htmlFor, label, required }) {
  const { t } = useT();

  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-soil-800">
      {label}
      {required && (
        <span className="text-rust-600">
          {' *'}
          <span className="sr-only">{` ${t('common.required')}`}</span>
        </span>
      )}
    </label>
  );
}

export function FieldMessages({ hintId, hint, errorId, error }) {
  if (error) {
    return (
      <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-rust-700">
        <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={hintId} className="mt-1.5 text-xs text-soil-500">
        {hint}
      </p>
    );
  }
  return null;
}
