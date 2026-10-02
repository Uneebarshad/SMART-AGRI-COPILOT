import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { LanguageMenu } from './LanguageMenu';
import { PlusIcon } from '../ui/icons/PlusIcon';
import { SpeakerIcon } from '../ui/icons/SpeakerIcon';
import { SpeakerOffIcon } from '../ui/icons/SpeakerOffIcon';

/**
 * Sticky assistant toolbar (frontend-spec.md §6.1): conversation title (h1),
 * "New chat", a "History" link and the language quick-switch. Full-bleed
 * negative margins undo the shell padding so the bar can stick under the
 * mobile navbar (`top-14`) or the viewport top on desktop.
 *
 * `voice` is an optional `{ supported, autoSpeak, onToggle }` snapshot that
 * renders the Phase-1 global auto-speak toggle; omitted (or unsupported) and
 * no control is shown, so typed chat is unaffected.
 */
export function AssistantHeader({ title, onNewChat, voice }) {
  const { t } = useT();

  return (
    <div className="sticky top-14 z-10 -mx-4 border-b border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 px-4 pb-1 pt-3 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 lg:top-0">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
        <h1 className="min-w-0 truncate font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onNewChat}
            aria-label={t('assistant.newChat')}
            title={t('assistant.newChat')}
            className="flex h-11 items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 dark:hover:bg-white/5"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('assistant.newChat')}</span>
          </button>
          <Link
            to="/conversations"
            className="flex h-11 items-center rounded-md px-2.5 text-sm font-medium text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 dark:hover:bg-white/5"
          >
            {t('nav.conversations')}
          </Link>
          {voice?.supported && (
            <button
              type="button"
              onClick={voice.onToggle}
              aria-pressed={voice.autoSpeak}
              aria-label={
                voice.autoSpeak ? t('assistant.voice.autoSpeakOn') : t('assistant.voice.autoSpeakOff')
              }
              title={
                voice.autoSpeak ? t('assistant.voice.autoSpeakOn') : t('assistant.voice.autoSpeakOff')
              }
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600',
                voice.autoSpeak
                  ? 'bg-field-100 text-field-700 dark:bg-field-900/20'
                  : 'text-soil-700 hover:bg-soil-100 dark:hover:bg-white/5',
              )}
            >
              {voice.autoSpeak ? (
                <SpeakerIcon className="h-5 w-5" />
              ) : (
                <SpeakerOffIcon className="h-5 w-5" />
              )}
            </button>
          )}
          <LanguageMenu />
        </div>
      </div>
    </div>
  );
}
