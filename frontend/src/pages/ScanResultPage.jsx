import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useScanResult } from '../hooks/useScanResult';
import { usePageTitle } from '../hooks/usePageTitle';
import { Button, ButtonLink, ErrorState, Skeleton } from '../components/ui';
import { DiagnosisResult } from '../components/diagnosis/DiagnosisResult';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';
import { getScanPhoto } from '../lib/localScans';

/**
 * Saved scan result (`/diagnosis/:scanId`, frontend-spec.md §5.4/§7.4):
 * read-only — it renders what was stored and never re-runs analysis. Photos
 * are session-only (Appendix A10): scans analyzed in this tab show their
 * image; anything older falls back to the leaf placeholder.
 */
export function ScanResultPage() {
  const { scanId } = useParams();
  const { t } = useT();
  const navigate = useNavigate();
  const { scan, loadStatus, retry } = useScanResult(scanId);
  usePageTitle(t('scanResult.title'));

  // Read once per scan id: the registry is plain memory, not reactive state.
  const photoUrl = useMemo(() => getScanPhoto(scanId), [scanId]);

  const backLink = (
    <Link
      to="/diagnosis"
      className="-ms-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-field-700 transition-colors hover:text-field-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
    >
      <ChevronRightIcon className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden="true" />
      {t('scanResult.back')}
    </Link>
  );

  if (loadStatus === 'loading' || loadStatus === 'idle') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {backLink}
        <div
          className="rounded-xl border border-soil-200 bg-surface p-4 shadow-card md:p-5"
          aria-hidden="true"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-7 w-3/5" />
              <Skeleton className="mt-2 h-4 w-2/5" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 aspect-[4/3] w-full max-w-xs rounded-lg" />
          <div className="mt-5 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (loadStatus === 'missing') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {backLink}
        <div className="flex flex-col items-center gap-4 rounded-xl border border-soil-200 bg-surface px-6 py-12 text-center shadow-card">
          <p className="max-w-sm text-base font-semibold text-soil-800">{t('scanResult.missing')}</p>
          <ButtonLink to="/diagnosis">{t('scanResult.missingAction')}</ButtonLink>
        </div>
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {backLink}
        <ErrorState message={t('scanResult.loadError')} onRetry={retry} />
      </div>
    );
  }

  // §6.5: continue the diagnosis in the assistant with a pre-filled question.
  const askAssistant = () =>
    navigate('/assistant', {
      state: { prefill: t('diagnosis.askTemplate').replace('{disease}', scan.disease?.name ?? '') },
    });

  let actions;
  if (scan.status === 'diagnosed') {
    actions = (
      <>
        <Button onClick={askAssistant}>
          <ChatIcon className="h-4 w-4" />
          {t('scanResult.askAssistant')}
        </Button>
        <ButtonLink variant="outline" to="/diagnosis">
          {t('scanResult.scanAnother')}
        </ButtonLink>
      </>
    );
  } else if (scan.status === 'uncertain') {
    actions = <ButtonLink to="/diagnosis">{t('scanResult.tryAgain')}</ButtonLink>;
  } else {
    actions = <ButtonLink to="/diagnosis">{t('scanResult.scanAnother')}</ButtonLink>;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      {backLink}
      <DiagnosisResult scan={scan} photoUrl={photoUrl} actions={actions} />
    </div>
  );
}

export default ScanResultPage;
