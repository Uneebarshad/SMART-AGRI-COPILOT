import { FieldDrawer } from '../fields/FieldDrawer';
import { Badge, Button } from '../ui';
import { CalendarIcon } from '../ui/icons/CalendarIcon';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { CATEGORY_ICONS, CATEGORY_LABELS, PRIORITY_TONES, PRIORITY_LABELS, STATUS_LABELS } from './recommendationPresentation';

const formatDate = (date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`));

function DetailRow({ label, value, Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-soil-100 py-3 last:border-0">
      <dt className="flex items-center gap-2 text-sm text-soil-500">
        {Icon && <Icon className="h-4 w-4 text-soil-400" />}
        {label}
      </dt>
      <dd className="text-end text-sm font-medium text-soil-800">{value}</dd>
    </div>
  );
}

export function RecommendationDetailsDrawer({ recommendation, onClose, onMarkDone, updating }) {
  if (!recommendation) return null;
  const Icon = CATEGORY_ICONS[recommendation.category];

  return (
    <FieldDrawer
      open={Boolean(recommendation)}
      onClose={onClose}
      title={recommendation.title}
      description="A practical next step for your farm"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {recommendation.status === 'active' ? (
            <Button onClick={() => onMarkDone(recommendation)} disabled={updating}>
              <CheckCircleIcon className="h-4 w-4" /> {updating ? 'Saving…' : 'Mark as done'}
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              <CheckCircleIcon className="h-4 w-4" /> Completed
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
            <Icon className="h-5 w-5" />
          </span>
          <Badge tone={PRIORITY_TONES[recommendation.priority]}>{PRIORITY_LABELS[recommendation.priority]} priority</Badge>
          <Badge tone={recommendation.status === 'completed' ? 'success' : 'neutral'}>{STATUS_LABELS[recommendation.status]}</Badge>
        </div>

        <dl className="rounded-lg border border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 px-4">
          <DetailRow label="Category" value={CATEGORY_LABELS[recommendation.category]} />
          <DetailRow label="Crop" value={recommendation.crop} Icon={SproutIcon} />
          <DetailRow label="Field" value={recommendation.field} Icon={MapPinIcon} />
          <DetailRow label="Date" value={formatDate(recommendation.date)} Icon={CalendarIcon} />
          <DetailRow label="Timing" value={recommendation.timing} />
        </dl>

        <section>
          <h3 className="text-sm font-semibold text-soil-900">Why this recommendation</h3>
          <p className="mt-2 text-sm leading-relaxed text-soil-700">{recommendation.why}</p>
        </section>

        <section className="rounded-lg border border-field-200 bg-field-50 p-4 dark:border-field-500/30 dark:bg-field-900/15">
          <h3 className="text-sm font-semibold text-field-900 dark:text-field-400">Recommended action</h3>
          <p className="mt-2 text-sm leading-relaxed text-field-800 dark:text-field-300">{recommendation.action}</p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-soil-900">Notes</h3>
          <p className="mt-2 rounded-lg border border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 p-4 text-sm leading-relaxed text-soil-700">{recommendation.notes}</p>
        </section>
      </div>
    </FieldDrawer>
  );
}
