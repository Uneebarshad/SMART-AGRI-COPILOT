import { Badge, Card } from '../ui';
import { ChevronRightIcon } from '../ui/icons/ChevronRightIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';

const CROP_TONES = {
  Tomato: 'bg-rust-50 text-rust-700 dark:bg-rust-900/15 dark:text-rust-400',
  Potato: 'bg-soil-100 text-soil-700 dark:bg-soil-200 dark:text-soil-500',
  Wheat: 'bg-sun-50 text-sun-800 dark:bg-sun-900/15 dark:text-sun-400',
  Rice: 'bg-sky-50 text-sky-700 dark:bg-sky-900/15 dark:text-sky-400',
  Cotton: 'bg-field-50 text-field-700 dark:bg-field-900/15 dark:text-field-400',
  Maize: 'bg-sun-100 text-sun-800 dark:bg-sun-900/15 dark:text-sun-400',
};

const SEVERITY_TONES = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

export function DiseaseCard({ disease, onViewDetails }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 md:p-0">
      <div className={`flex h-32 items-center justify-center ${CROP_TONES[disease.crop] || 'bg-field-50 text-field-700'}`}>
        <div className="flex flex-col items-center gap-1">
          <LeafIcon className="h-12 w-12" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">{disease.crop}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_TONES[disease.severity]}>{disease.severity} severity</Badge>
          <span className="text-xs text-soil-500">{disease.type}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold text-soil-900">{disease.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-soil-600">{disease.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-soil-100 dark:border-soil-200 pt-3">
          <span className="text-xs font-medium text-soil-500">{disease.symptoms.length} common signs</span>
          <button
            type="button"
            onClick={() => onViewDetails(disease)}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-field-700 transition-colors hover:bg-field-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 dark:text-field-400 dark:hover:bg-field-900/15"
          >
            View details
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
