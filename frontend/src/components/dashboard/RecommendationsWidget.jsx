import { Link } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { ButtonLink, Card, EmptyState, ErrorState, Skeleton } from '../ui';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { RecommendationCard } from '../recommendations/RecommendationCard';
import { SectionHeader, sectionLinkClass } from './SectionHeader';

/**
 * Top 2 recommendations + "View all" (frontend-spec.md §8.1 widget 7).
 */
export function RecommendationsWidget({ status, recommendations, onRetry }) {
  const { t } = useT();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t('home.recommendationsTitle')}
        action={
          <Link to="/recommendations" className={sectionLinkClass}>
            {t('home.viewAll')}
          </Link>
        }
      />
      {status === 'loading' && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-xl border border-soil-200 bg-surface p-4 shadow-card"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
              <div className="w-full">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}
      {status === 'error' && (
        <ErrorState compact message={t('home.recommendationsError')} onRetry={onRetry} />
      )}
      {status === 'success' && recommendations?.length > 0 && (
        <ul className="flex flex-col gap-4">
          {recommendations.slice(0, 2).map((recommendation) => (
            <li key={recommendation.id}>
              <RecommendationCard
                category={recommendation.category}
                priority={recommendation.priority}
                title={recommendation.title}
                text={recommendation.text}
              />
            </li>
          ))}
        </ul>
      )}
      {status === 'success' && !recommendations?.length && (
        <Card>
          <EmptyState
            icon={ChatIcon}
            title={t('home.recsEmptyTitle')}
            description={t('home.recsEmptyDesc')}
            action={<ButtonLink to="/assistant">{t('home.startConversation')}</ButtonLink>}
          />
        </Card>
      )}
    </section>
  );
}
