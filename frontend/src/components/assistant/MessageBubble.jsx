import { useT } from '../../i18n/useT';
import { formatTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import { SourcesDisclosure } from './SourcesDisclosure';
import { AlertTriangleIcon } from '../ui/icons/AlertTriangleIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { SpeakerIcon } from '../ui/icons/SpeakerIcon';
import { SpeakerOffIcon } from '../ui/icons/SpeakerOffIcon';

/**
 * One chat message (frontend-spec.md §6.2). User bubbles are field-tinted and
 * end-aligned; assistant messages are white cards with an avatar, optional
 * sources and a timestamp. Content renders as plain text only — never HTML
 * or markdown (§16.4). A failed user message shows the rust treatment and,
 * when retryable, the bubble itself taps to retry (§6.10).
 */
export function MessageBubble({ message, onRetry, onSpeak, speaking = false, speakSupported = false }) {
  const { t, lang } = useT();

  if (message.role === 'user') {
    const failed = message.status === 'failed';
    const retryable = failed && message.error?.retryable !== false;
    const bubbleClass = cn(
      'max-w-sm rounded-xl px-4 py-2.5 text-start text-base break-words whitespace-pre-wrap text-soil-900 sm:max-w-lg',
      failed ? 'border border-rust-300 bg-rust-50 dark:border-rust-500/30 dark:bg-rust-900/15' : 'bg-field-100 dark:bg-field-900/20',
      message.status === 'sending' && 'opacity-60',
      retryable && 'text-start transition-colors hover:border-rust-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-600 focus-visible:ring-offset-2',
    );
    const content = <p>{message.content}</p>;

    return (
      <li className="flex flex-col items-end gap-1">
        {retryable ? (
          <button
            type="button"
            aria-label={t('assistant.failedRetry')}
            onClick={() => onRetry?.(message.id)}
            className={bubbleClass}
          >
            {content}
          </button>
        ) : (
          <div className={bubbleClass}>{content}</div>
        )}
        <p className="pe-1 text-xs text-soil-500">
          {failed ? (
            <span className="flex items-center gap-1 font-medium text-rust-700">
              <AlertTriangleIcon className="h-3.5 w-3.5" />
              {retryable ? t('assistant.failedRetry') : message.error?.message}
            </span>
          ) : (
            formatTime(message.createdAt, lang)
          )}
        </p>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-field-600 text-white"
      >
        <SproutIcon className="h-4 w-4" />
      </span>
      <div className="flex max-w-sm flex-col gap-1 sm:max-w-lg">
        <div className="rounded-xl border border-soil-200 bg-surface p-4 shadow-card">
          <p className="max-w-2xl text-base leading-relaxed break-words whitespace-pre-wrap text-soil-800">
            {message.content}
          </p>
          {message.sources?.length > 0 && <SourcesDisclosure sources={message.sources} />}
        </div>
        <div className="flex w-full items-center justify-between gap-2 px-1">
          <p className="text-xs text-soil-500">
            {message.createdAt ? formatTime(message.createdAt, lang) : ''}
          </p>
          {speakSupported && (
            <button
              type="button"
              onClick={() => onSpeak?.(message)}
              aria-pressed={speaking}
              aria-label={
                speaking ? t('assistant.voice.stopSpeaking') : t('assistant.voice.speak')
              }
              title={
                speaking ? t('assistant.voice.stopSpeaking') : t('assistant.voice.speak')
              }
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600',
                speaking
                  ? 'bg-field-100 text-field-700 dark:bg-field-900/20'
                  : 'text-soil-400 hover:bg-soil-100 hover:text-soil-700 dark:hover:bg-white/5',
              )}
            >
              {speaking ? (
                <SpeakerOffIcon className="h-4 w-4" />
              ) : (
                <SpeakerIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
