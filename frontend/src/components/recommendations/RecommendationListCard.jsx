import { Badge, Button, Card } from '../ui';
import { CalendarIcon } from '../ui/icons/CalendarIcon';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { CATEGORY_ICONS, CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_TONES, STATUS_LABELS } from './recommendationPresentation';

const formatDate = (date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));

export function RecommendationListCard({ recommendation, onViewDetails, onMarkDone, updating }) {
  const Icon = CATEGORY_ICONS[recommendation.category];
  const completed = recommendation.status === 'completed';

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PRIORITY_TONES[recommendation.priority]}>{PRIORITY_LABELS[recommendation.priority]} priority</Badge>
            <Badge tone={completed ? 'success' : 'neutral'} dot={completed}>{STATUS_LABELS[recommendation.status]}</Badge>
          </div>
          <p className="mt-2 text-xs font-medium text-soil-500">{CATEGORY_LABELS[recommendation.category]}</p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-soil-900">{recommendation.title}</h3>
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-soil-600">{recommendation.description}</p>

      <div className="mt-auto space-y-2 border-t border-soil-100 pt-3 text-xs text-soil-600">
        <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-soil-400" /> {recommendation.crop} · {recommendation.field}</div>
        <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-soil-400" /> {formatDate(recommendation.date)}</div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(recommendation)}>View details</Button>
        {!completed && (
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onMarkDone(recommendation)} disabled={updating}>
            <CheckCircleIcon className="h-4 w-4" /> {updating ? 'Saving…' : 'Mark as done'}
          </Button>
        )}
      </div>
    </Card>
  );
}
