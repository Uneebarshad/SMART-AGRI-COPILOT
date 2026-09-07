import { Badge } from '../ui';
import { FieldDrawer } from '../fields/FieldDrawer';
import { InfoIcon } from '../ui/icons/InfoIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';

const SEVERITY_TONES = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

function DetailList({ title, items }) {
  return (
    <section>
      <h3 className="font-display text-lg font-semibold tracking-tight text-soil-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-soil-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-field-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiseaseDetailDrawer({ disease, onClose }) {
  if (!disease) return null;

  return (
    <FieldDrawer
      open={Boolean(disease)}
      onClose={onClose}
      title={disease.name}
      description="Educational reference · not a diagnosis"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-800 dark:border-sky-500/30 dark:bg-sky-900/15 dark:text-sky-400">
          <InfoIcon className="h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed">
            This general information can help with observation and prevention. It cannot confirm what is affecting a plant; compare signs carefully and seek local expert advice.
          </p>
        </div>

        <section aria-labelledby="disease-overview-title">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
              <LeafIcon className="h-6 w-6" />
            </span>
            <div>
              <h3 id="disease-overview-title" className="font-display text-lg font-semibold tracking-tight text-soil-900">Overview</h3>
              <p className="mt-0.5 text-sm text-soil-600">{disease.description}</p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-soil-100 dark:divide-soil-300 rounded-lg border border-soil-200 dark:border-soil-300 bg-soil-50 dark:bg-soil-200 px-4">
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-soil-500">Crop</dt>
              <dd className="text-end text-sm font-medium text-soil-800">{disease.crop}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-soil-500">Disease type</dt>
              <dd className="text-end text-sm font-medium text-soil-800">{disease.type}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-soil-500">Typical severity</dt>
              <dd><Badge tone={SEVERITY_TONES[disease.severity]}>{disease.severity}</Badge></dd>
            </div>
          </dl>
        </section>

        <DetailList title="Symptoms" items={disease.symptoms} />
        <DetailList title="Causes" items={disease.causes} />
        <DetailList title="Prevention" items={disease.prevention} />
        <DetailList title="Recommended actions" items={disease.recommendedActions} />
      </div>
    </FieldDrawer>
  );
}
