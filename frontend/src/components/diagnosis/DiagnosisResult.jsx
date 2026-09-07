import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { Badge, Banner, Card } from '../ui';
import { CONFIDENCE_TONES, cropLabelKey, getConfidenceTier, SEVERITY_TONES } from '../../lib/diagnosis';
import { formatDate } from '../../lib/format';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';

const SEVERITY_LABEL_KEYS = {
  low: 'scanResult.severityLow',
  moderate: 'scanResult.severityModerate',
  high: 'scanResult.severityHigh',
};

const CONFIDENCE_LABEL_KEYS = {
  high: 'scanResult.confidenceHigh',
  medium: 'scanResult.confidenceMedium',
  low: 'scanResult.confidenceLow',
};

const RETAKE_TIP_KEYS = ['scanResult.retakeTip1', 'scanResult.retakeTip2', 'scanResult.retakeTip3'];

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-soil-700">{children}</h3>;
}

function ScanPhoto({ photoUrl, imageUrl, alt }) {
  const source = photoUrl ?? imageUrl;
  if (source) {
    return (
      <div className="mt-4 w-full max-w-xs overflow-hidden rounded-lg border border-soil-200">
        <div className="aspect-[4/3] w-full">
          <img src={source} alt={alt} className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }
  // No persisted photos (Appendix A10) — a placeholder stands in for old scans.
  return (
    <div className="mt-4 w-full max-w-xs rounded-lg border border-soil-200 dark:border-soil-200 bg-field-50 dark:bg-field-900/15" aria-hidden="true">
      <div className="flex aspect-[4/3] w-full items-center justify-center text-field-600 dark:text-field-400">
        <LeafIcon className="h-10 w-10" />
      </div>
    </div>
  );
}

function MetaLine({ scan, t, lang }) {
  const parts = [t('scanResult.scanned'), formatDate(scan.createdAt, lang)];
  const cropKey = cropLabelKey(scan.crop);
  if (cropKey) {
    parts.push(`${t('scanResult.cropLabel')}: ${t(cropKey)}`);
  }
  return <p className="mt-1 text-sm text-soil-500">{parts.join(' · ')}</p>;
}

function DiagnosisHeader({ scan, t, lang }) {
  const tier = getConfidenceTier(scan.confidence);
  const percent = Math.round(scan.confidence * 100);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight text-soil-900 md:text-2xl">
          {scan.disease.name}
        </h2>
        <MetaLine scan={scan} t={t} lang={lang} />
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Badge tone={SEVERITY_TONES[scan.severity]}>{t(SEVERITY_LABEL_KEYS[scan.severity])}</Badge>
        <Badge tone={CONFIDENCE_TONES[tier]}>
          {t(CONFIDENCE_LABEL_KEYS[tier])} ({percent} %)
        </Badge>
      </div>
    </div>
  );
}

/**
 * Diagnosis result card (frontend-spec.md §7.4): renders the diagnosed,
 * healthy and uncertain states — also used read-only at /diagnosis/:scanId.
 * `actions` (optional) lands in the card's footer as the "Next actions" row.
 */
export function DiagnosisResult({ scan, photoUrl, actions }) {
  const { t, lang } = useT();

  if (scan.status === 'healthy') {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
            <CheckCircleIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-soil-900 md:text-2xl">
              {t('scanResult.healthyTitle')}
            </h2>
            <p className="mt-1 text-sm text-soil-600">{t('scanResult.healthySubtitle')}</p>
          </div>
        </div>
        <ScanPhoto photoUrl={photoUrl} imageUrl={scan.imageUrl} alt={t('diagnosis.previewAlt')} />
        <div className="mt-4 flex flex-col gap-2">
          <SectionTitle>{t('scanResult.healthyTipsTitle')}</SectionTitle>
          <ul className="flex flex-col gap-1.5 ps-1">
            {scan.careTips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm text-soil-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-field-500" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <Banner tone="info" className="mt-4">
          {t('scanResult.disclaimer')}
        </Banner>
        {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-soil-100 pt-3">{actions}</div>}
      </Card>
    );
  }

  if (scan.status === 'uncertain') {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soil-100 text-soil-600 dark:bg-soil-200 dark:text-soil-400">
            <LeafIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-soil-900 md:text-2xl">
              {t('scanResult.uncertainTitle')}
            </h2>
            <p className="mt-1 text-sm text-soil-600">{t('scanResult.uncertainBody')}</p>
          </div>
        </div>
        <ScanPhoto photoUrl={photoUrl} imageUrl={scan.imageUrl} alt={t('diagnosis.previewAlt')} />
        <div className="mt-4 flex flex-col gap-2">
          <SectionTitle>{t('scanResult.retakeTitle')}</SectionTitle>
          <ul className="flex flex-col gap-1.5 ps-1">
            {RETAKE_TIP_KEYS.map((key) => (
              <li key={key} className="flex gap-2.5 text-sm text-soil-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sun-500" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <Banner tone="info" className="mt-4">
          {t('scanResult.disclaimer')}
        </Banner>
        {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-soil-100 pt-3">{actions}</div>}
      </Card>
    );
  }

  const tier = getConfidenceTier(scan.confidence);

  return (
    <Card>
      <DiagnosisHeader scan={scan} t={t} lang={lang} />
      <ScanPhoto photoUrl={photoUrl} imageUrl={scan.imageUrl} alt={t('diagnosis.previewAlt')} />
      {tier === 'low' && (
        <Banner tone="warning" className="mt-4">
          {t('scanResult.lowConfidenceNote')}
        </Banner>
      )}
      <div className="mt-5 flex flex-col gap-2">
        <SectionTitle>{t('scanResult.symptomsTitle')}</SectionTitle>
        <ul className="flex flex-col gap-1.5 ps-1">
          {scan.symptoms.map((symptom) => (
            <li key={symptom} className="flex gap-2.5 text-sm text-soil-700">
              <span
                className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rust-400')}
                aria-hidden="true"
              />
              {symptom}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <SectionTitle>{t('scanResult.treatmentTitle')}</SectionTitle>
        <ol className="flex flex-col gap-2 ps-1">
          {scan.treatmentSteps.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-sm text-soil-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-field-100 text-xs font-semibold text-field-800 tabular-nums dark:bg-field-900/20 dark:text-field-400">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <SectionTitle>{t('scanResult.preventionTitle')}</SectionTitle>
        <ul className="flex flex-col gap-1.5 ps-1">
          {scan.prevention.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-soil-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-field-500" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <Banner tone="info" className="mt-5">
        {t('scanResult.disclaimer')}
      </Banner>
      {actions && <div className="mt-4 flex flex-wrap gap-2 border-t border-soil-100 pt-3">{actions}</div>}
    </Card>
  );
}
