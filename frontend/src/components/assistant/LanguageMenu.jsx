import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../../i18n/I18nProvider';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { ChevronDownIcon } from '../ui/icons/ChevronDownIcon';
import { GlobeIcon } from '../ui/icons/GlobeIcon';

/**
 * Language quick-switch from the assistant header (frontend-spec.md §6.1,
 * §13.4): shows the active language and opens the same options as Settings,
 * applying instantly without a reload — the chat draft survives the switch.
 */
export function LanguageMenu() {
  const { t, lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeLabel = LANGUAGES.find((language) => language.code === lang)?.label ?? 'English';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('common.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 max-w-32 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
      >
        <GlobeIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{activeLabel}</span>
        <ChevronDownIcon className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('common.language')}
          className="absolute end-0 top-full z-30 mt-2 w-44 rounded-xl border border-soil-200 bg-surface p-1.5 shadow-raised"
        >
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              role="menuitemradio"
              aria-checked={language.code === lang}
              onClick={() => {
                setLang(language.code);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-start text-sm font-medium text-soil-800 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600"
            >
              <span className="truncate">{language.label}</span>
              {language.code === lang && <CheckCircleIcon className="h-4 w-4 shrink-0 text-field-700" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
