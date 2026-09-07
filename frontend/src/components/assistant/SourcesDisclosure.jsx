import { useState } from 'react';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { ChevronDownIcon } from '../ui/icons/ChevronDownIcon';
import { InfoIcon } from '../ui/icons/InfoIcon';

/**
 * Collapsible "Sources" disclosure under an assistant message
 * (frontend-spec.md §6.8): plain-text links open in a new tab with
 * `rel="noopener noreferrer"`; sources without a URL stay plain text.
 */
export function SourcesDisclosure({ sources }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-soil-100 pt-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-1.5 text-xs font-medium text-field-700 transition-colors hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 rounded-sm"
      >
        <InfoIcon className="h-3.5 w-3.5 shrink-0" />
        {t('assistant.sources')}
        <ChevronDownIcon className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5 pb-1.5">
          {sources.map((source, index) => (
            <li key={index} className="text-xs leading-relaxed">
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-field-700 underline underline-offset-2 transition-colors hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 rounded-sm"
                >
                  {source.title}
                </a>
              ) : (
                <span className="text-soil-600">{source.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
