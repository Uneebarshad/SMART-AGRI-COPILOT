import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useDiagnosis } from '../hooks/useDiagnosis';
import { usePageTitle } from '../hooks/usePageTitle';
import { Banner, Button, ErrorState, SelectField, TextAreaField } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { AnalysisProgress } from '../components/diagnosis/AnalysisProgress';
import { ImageDropzone } from '../components/diagnosis/ImageDropzone';
import { ImagePreview } from '../components/diagnosis/ImagePreview';
import { PastScans } from '../components/diagnosis/PastScans';
import { PhotoTipSheet } from '../components/diagnosis/PhotoTipSheet';
import { CameraIcon } from '../components/ui/icons/CameraIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { CROP_VALUES, cropLabelKey } from '../lib/diagnosis';

const NOTE_MAX_LENGTH = 200;

const STEPS = [
  { id: 1, label: 'Upload leaf', icon: CameraIcon },
  { id: 2, label: 'Add details', icon: SproutIcon },
  { id: 3, label: 'Get diagnosis', icon: SearchIcon },
  { id: 4, label: 'See results', icon: CheckCircleIcon },
];

function FlowSteps({ activeStep }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-soil-200 dark:border-soil-200 bg-surface p-3 shadow-card">
      {STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isComplete = step.id < activeStep;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={
                  isActive
                    ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field-600 text-white'
                    : isComplete
                      ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400'
                      : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soil-100 text-soil-400'
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={
                  isActive
                    ? 'hidden text-xs font-semibold text-field-800 sm:inline'
                    : isComplete
                      ? 'hidden text-xs font-medium text-field-700 dark:text-field-400 sm:inline'
                      : 'hidden text-xs text-soil-400 sm:inline'
                }
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={
                  isComplete
                    ? 'mx-1 h-px flex-1 bg-field-300 dark:bg-field-500/30'
                    : 'mx-1 h-px flex-1 bg-soil-200 dark:bg-soil-200'
                }
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Disease check (`/diagnosis`, frontend-spec.md §5.4/§7.1–§7.5): capture a
 * validated leaf photo, add optional crop/note context, analyze (staged,
 * cancellable), then continue to the saved result at /diagnosis/:scanId.
 * useDiagnosis owns every piece of state; this page only composes the flow.
 */
export function DiagnosisPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle(t('diagnosis.title'));

  const {
    photo,
    crop,
    notes,
    validationKey,
    analyzing,
    analysisError,
    pastScans,
    pastScansError,
    setCrop,
    setNotes,
    selectImage,
    removeImage,
    analyze,
    cancelAnalysis,
    retryPastScans,
  } = useDiagnosis();

  const fileInputRef = useRef(null);

  // Assistant photo hand-off (§6.5): the composer's photo arrives via
  // location.state with its own object URL (ownership moves here). Consume it
  // once, then strip the state so a browser-back doesn't re-select a URL this
  // page has since revoked.
  const pendingPhoto = location.state?.pendingPhoto;
  useEffect(() => {
    if (!pendingPhoto) return undefined;
    navigate('/diagnosis', { replace: true, state: null });
    selectImage(pendingPhoto.file, pendingPhoto.objectUrl);
    return undefined;
  }, [pendingPhoto, navigate, selectImage]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      selectImage(file);
    }
  };

  // On success the hook parks the photo's URL in the session registry and
  // resolves with the new scan id (§7.4, Appendix A10).
  const handleAnalyze = async () => {
    const scanId = await analyze();
    if (scanId) {
      navigate(`/diagnosis/${scanId}`);
    }
  };

  const currentStep = analyzing ? 3 : photo ? 2 : 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('diagnosis.title')} subtitle={t('diagnosis.subtitle')} />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <FlowSteps activeStep={currentStep} />
        <PhotoTipSheet />

        {validationKey && <Banner tone="error">{t(validationKey)}</Banner>}

        {photo ? (
          <ImagePreview
            photo={photo}
            analyzing={analyzing}
            onRemove={removeImage}
            onReplace={() => fileInputRef.current?.click()}
          />
        ) : (
          <ImageDropzone
            onFileSelected={selectImage}
            onOpenPicker={() => fileInputRef.current?.click()}
          />
        )}

        {analyzing ? (
          <AnalysisProgress onCancel={cancelAnalysis} />
        ) : (
          <>
            {analysisError && (
              <ErrorState
                message={analysisError.retryable ? t('diagnosis.analysisError') : analysisError.message}
                onRetry={analysisError.retryable ? handleAnalyze : undefined}
              />
            )}
            {photo && (
              <div className="flex flex-col gap-4">
                <SelectField
                  label={t('diagnosis.cropLabel')}
                  hint={t('diagnosis.cropHint')}
                  placeholder={t('diagnosis.cropPlaceholder')}
                  value={crop}
                  onChange={(event) => setCrop(event.target.value)}
                  options={CROP_VALUES.map((value) => ({ value, label: t(cropLabelKey(value)) }))}
                />
                <TextAreaField
                  label={t('diagnosis.noteLabel')}
                  hint={t('diagnosis.noteHint')}
                  placeholder={t('diagnosis.notePlaceholder')}
                  rows={3}
                  maxLength={NOTE_MAX_LENGTH}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <Button size="lg" className="w-full sm:w-auto" onClick={handleAnalyze}>
                  <SearchIcon className="h-4 w-4" />
                  {t('diagnosis.analyze')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mx-auto w-full max-w-xl">
        {pastScansError ? (
          <ErrorState compact message={t('diagnosis.pastError')} onRetry={retryPastScans} />
        ) : (
          <PastScans scans={pastScans} />
        )}
      </div>

      {/* Hidden picker — the visible buttons are the accessible path (§7.1). */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default DiagnosisPage;
