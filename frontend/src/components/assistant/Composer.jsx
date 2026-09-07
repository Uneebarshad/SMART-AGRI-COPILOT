import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '../../i18n/useT';
import { CameraIcon } from '../ui/icons/CameraIcon';
import { InfoIcon } from '../ui/icons/InfoIcon';
import { PaperAirplaneIcon } from '../ui/icons/PaperAirplaneIcon';

const MAX_LENGTH = 2000; // frontend-spec.md §15.4
const COUNTER_THRESHOLD = MAX_LENGTH - 200;

/**
 * Docked composer (frontend-spec.md §6.1/§6.3): auto-growing textarea (4
 * lines max), attach button for the photo hand-off (§6.5), and a primary
 * send action. Normal document flow — not fixed — so mobile keyboards push
 * it, and the draft survives language switches (§13.4). `initialValue` seeds
 * the draft once (§6.5 hand-off from the diagnosis result screen). The
 * trailing slot after send stays reserved for a future mic control (§6.6);
 * text is 16 px to prevent iOS zoom (§9.2).
 */
export function Composer({ disabled = false, onSend, onAttach, initialValue = '' }) {
  const { t } = useT();
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);
  const hintId = useId();

  const trimmed = value.trim();
  const tooLong = value.length > MAX_LENGTH;
  const canSend = trimmed.length > 0 && !tooLong && !disabled;

  const resize = () => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  // Size the seeded draft (if any) on mount.
  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
    requestAnimationFrame(() => {
      resize();
      textareaRef.current?.focus();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center justify-center gap-1.5 px-2 text-center text-xs text-soil-500">
        <InfoIcon className="h-3.5 w-3.5 shrink-0" />
        {t('assistant.disclaimer')}
      </p>
      <div className="flex items-end gap-1.5 rounded-2xl border border-soil-300 bg-surface p-1.5 shadow-card transition-colors focus-within:border-field-600 focus-within:ring-2 focus-within:ring-field-600/20">
        <button
          type="button"
          onClick={onAttach}
          aria-label={t('assistant.attach')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-soil-500 transition-colors hover:bg-soil-100 hover:text-soil-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 dark:hover:bg-white/5"
        >
          <CameraIcon className="h-5 w-5" />
        </button>
        <label htmlFor="assistant-composer" className="sr-only">
          {t('assistant.composerLabel')}
        </label>
        <textarea
          id="assistant-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={t('assistant.composerPlaceholder')}
          aria-invalid={tooLong || undefined}
          aria-describedby={tooLong ? hintId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            resize();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-28 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base text-soil-900 placeholder:text-soil-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label={t('assistant.send')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-field-600 text-white transition-colors hover:bg-field-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PaperAirplaneIcon className="h-5 w-5 rtl:-scale-x-100" />
        </button>
      </div>
      {value.length > COUNTER_THRESHOLD && !tooLong && (
        <p className="self-end pe-1 text-xs text-soil-400" aria-hidden="true">
          {value.length}/{MAX_LENGTH}
        </p>
      )}
      {tooLong && (
        <p id={hintId} className="self-end pe-1 text-xs text-rust-700">
          {t('assistant.charLimit')}
        </p>
      )}
    </div>
  );
}
