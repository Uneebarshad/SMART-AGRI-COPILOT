import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { relativeTime } from '../../lib/format';
import { ErrorState, Skeleton } from '../ui';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';

/**
 * Recent Activity card (reference design): compact rows for the last
 * assistant question and the last leaf scan, each with a relative
 * timestamp; "View all" opens the full history. Tapping a row resumes
 * that flow (frontend-spec.md §5.3 F3, F4).
 */
export function RecentActivity({ status, recentActivity, onRetry }) {
  const { t, lang } = useT();
  const navigate = useNavigate();

  const conversation = recentActivity?.last_conversation;
  const scan = recentActivity?.last_scan;

  const rowClass = cn(
    'group flex items-center gap-3 rounded-xl p-3 transition-colors duration-200',
    'hover:bg-soil-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500',
    'dark:hover:bg-field-500/[0.06]',
  );

  return (
    <section
      aria-labelledby="recent-activity-heading"
      className="animate-[fadeIn_0.4s_ease-out] rounded-2xl border border-soil-200 bg-surface shadow-card"
    >
      <div className="flex items-center justify-between gap-3 p-5 pb-2">
        <h2 id="recent-activity-heading" className="flex items-center gap-2.5 text-base font-semibold text-soil-900 dark:text-soil-950">
          <LeafIcon className="h-5 w-5 text-field-600 dark:text-field-400" />
          {t('home.recentTitle')}
        </h2>
        <Link
          to="/history"
          className="rounded-sm text-sm font-medium text-field-700 dark:text-field-400 transition-colors duration-150 hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500"
        >
          {t('home.viewAll')}
        </Link>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col gap-2 px-3 pb-4">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-14 rounded-lg" />
          ))}
        </div>
      )}
      {status === 'error' && (
        <div className="px-5 pb-5">
          <ErrorState compact message={t('home.recentError')} onRetry={onRetry} />
        </div>
      )}
      {status === 'success' && !conversation && !scan && (
        <div className="px-4 pb-5 pt-1">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-soil-200 bg-soil-50/60 px-4 py-8 text-center dark:border-soil-200 dark:bg-field-500/[0.04]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-field-100 text-field-600 dark:bg-field-500/12 dark:text-field-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                <path d="M12 8v4l3 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-soil-900 dark:text-soil-950">{t('home.recentEmptyTitle')}</p>
            <p className="max-w-xs text-sm text-soil-500 dark:text-soil-600">{t('home.recentEmptyDesc')}</p>
          </div>
        </div>
      )}
      {status === 'success' && (conversation || scan) && (
        <ul className="flex flex-col gap-1 px-2 pb-3">
          {conversation && (
            <li>
              <button
                type="button"
                onClick={() => navigate(`/assistant/${conversation.conversation_id}`)}
                className={cn(rowClass, 'w-full text-start')}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ai-100 text-ai-700 dark:bg-ai-500/15 dark:text-ai-400">
                  <ChatIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-soil-900 dark:text-soil-950">{t('home.recentAssistant')}</span>
                  <span className="mt-0.5 block truncate text-xs text-soil-500 dark:text-soil-600">{conversation.question}</span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 transition-transform duration-150 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </button>
            </li>
          )}
          {scan && (
            <li>
              <button
                type="button"
                onClick={() => navigate(`/diagnosis/${scan.scan_id}`)}
                className={cn(rowClass, 'w-full text-start')}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-500/15 dark:text-field-300">
                  <LeafIcon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-soil-900 dark:text-soil-950">
                    {scan.disease ?? t('home.recentScan')}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-soil-500 dark:text-soil-600">
                    {scan.scanned_at ? relativeTime(scan.scanned_at, lang) : t('home.recentScan')}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-soil-400 transition-transform duration-150 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
