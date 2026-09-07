import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { getDisease } from '../services/diseaseService';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge, Banner, ButtonLink, Card, ErrorState, Skeleton } from '../components/ui';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';

const SEVERITY_TONES = { Low: 'success', Medium: 'warning', High: 'danger' };

function DetailList({ title, items }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-soil-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-field-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiseaseDetailPage() {
  const { id } = useParams();
  const [disease, setDisease] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading');
  usePageTitle(disease?.name ?? 'Disease details');

  const loadDisease = useCallback(() => {
    setLoadStatus('loading');
    getDisease(id)
      .then((result) => {
        setDisease(result);
        setLoadStatus(result ? 'success' : 'not_found');
      })
      .catch(() => setLoadStatus('error'));
  }, [id]);

  useEffect(() => {
    loadDisease();
  }, [loadDisease]);

  if (loadStatus === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-64" />
        <Card className="space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    );
  }

  if (loadStatus === 'error' || loadStatus === 'not_found' || !disease) {
    return (
      <div className="mx-auto max-w-xl">
        <ErrorState title="Disease entry not found" message="This library entry may have moved. Browse the full disease library to find another crop guide." />
        <div className="flex justify-center"><ButtonLink to="/diseases">Browse disease library</ButtonLink></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/diseases" className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-md px-1 text-sm font-medium text-field-700 transition-colors hover:bg-field-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2">
        <ChevronRightIcon className="h-4 w-4 rotate-180 rtl:rotate-0" /> Back to disease library
      </Link>
      <PageHeader title={disease.name} subtitle={`${disease.crop} · ${disease.type} · educational reference`} eyebrow="Disease guide" />
      <Banner tone="info">This guide supports observation and prevention. It does not confirm a diagnosis; compare signs carefully and seek local expert advice.</Banner>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
              <LeafIcon className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={SEVERITY_TONES[disease.severity]}>{disease.severity} severity</Badge>
                <span className="text-xs font-medium text-soil-500">{disease.type}</span>
              </div>
              <p className="mt-3 text-base leading-relaxed text-soil-700">{disease.description}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 border-t border-soil-100 pt-6 md:grid-cols-2">
            <DetailList title="Symptoms" items={disease.symptoms} />
            <DetailList title="Causes" items={disease.causes} />
            <DetailList title="Prevention" items={disease.prevention} />
            <DetailList title="Recommended actions" items={disease.recommendedActions} />
          </div>
        </Card>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Card className="bg-soil-50 dark:bg-soil-200">
            <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">At a glance</h2>
            <dl className="mt-4 divide-y divide-soil-200">
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0"><dt className="text-sm text-soil-500">Crop</dt><dd className="text-sm font-semibold text-soil-900">{disease.crop}</dd></div>
              <div className="flex items-center justify-between gap-3 py-3"><dt className="text-sm text-soil-500">Disease type</dt><dd className="text-sm font-semibold text-soil-900">{disease.type}</dd></div>
              <div className="flex items-center justify-between gap-3 py-3 last:pb-0"><dt className="text-sm text-soil-500">Common signs</dt><dd className="text-sm font-semibold text-soil-900">{disease.symptoms.length}</dd></div>
            </dl>
          </Card>
          <Card className="border-field-200 bg-field-50 dark:border-field-500/30 dark:bg-field-900/15">
            <SearchIcon className="h-5 w-5 text-field-700 dark:text-field-400" />
            <h2 className="mt-3 font-display text-lg font-semibold tracking-tight text-field-900 dark:text-field-400">Not sure what you are seeing?</h2>
            <p className="mt-1 text-sm leading-relaxed text-field-800 dark:text-field-300">Use a clear leaf photo to start a guided check, then compare the result with this reference.</p>
            <ButtonLink to="/diagnosis" variant="secondary" className="mt-4 w-full">Start leaf diagnosis</ButtonLink>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default DiseaseDetailPage;
