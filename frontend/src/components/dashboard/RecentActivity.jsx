import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { formatDate } from '../../lib/format';
import { Badge, ButtonLink, Card, EmptyState, ErrorState, Skeleton } from '../ui';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SectionHeader } from './SectionHeader';

/**
 * Recent AI activity (frontend-spec.md §8.1 widget 6): two rows — the last
 * assistant question with answer preview, and the last scan with its disease
 * badge. Tapping a row resumes that flow (§5.3 F3, F4).
 */
export function RecentActivity({ status, recentActivity, onRetry }) {
  const { t, lang } = useT();
  const navigate = useNavigate();

  const conversation = recentActivity?.last_conversation;
  const scan = recentActivity?.last_scan;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t('home.recentTitle')} />
      {status === 'loading' && (
        <ul className="flex flex-col gap-4">
          {[0, 1].map((key) => (
            <li key={key} className="rounded-xl border border-soil-200 bg-surface p-4 shadow-card">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="mt-2 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
            </li>
          ))}
        </ul>
      )}
      {status === 'error' && (
        <ErrorState compact message={t('home.recentError')} onRetry={onRetry} />
      )}
      {status === 'success' && !conversation && !scan && (
        <Card>
          <EmptyState
            icon={ChatIcon}
            title={t('home.recentEmptyTitle')}
            description={t('home.recentEmptyDesc')}
            action={<ButtonLink to="/assistant">{t('home.startConversation')}</ButtonLink>}
          />
        </Card>
      )}
      {status === 'success' && (conversation || scan) && (
        <ul className="flex flex-col gap-4">
          {conversation && (
            <li>
              <Card onClick={() => navigate(`/assistant/${conversation.conversation_id}`)}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400">
                    <ChatIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-soil-500">{t('home.recentAssistant')}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-soil-900">
                      {conversation.question}
                    </p>
                    {conversation.answerPreview && (
                      <p className="mt-1 line-clamp-2 text-sm text-soil-600">
                        {conversation.answerPreview}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          )}
          {scan && (
            <li>
              <Card onClick={() => navigate(`/diagnosis/${scan.scan_id}`)}>
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                    <LeafIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-soil-500">{t('home.recentScan')}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      {scan.disease && (
                        <p className="text-sm font-semibold text-soil-900">{scan.disease}</p>
                      )}
                      <Badge tone={scan.is_healthy ? 'success' : 'danger'}>
                        {scan.is_healthy
                          ? t('home.scanHealthy')
                          : `${Math.round((scan.confidence ?? 0) * 100)}%`}
                      </Badge>
                    </div>
                    {scan.scanned_at && (
                      <p className="mt-1 text-xs text-soil-500">
                        {formatDate(scan.scanned_at, lang)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
