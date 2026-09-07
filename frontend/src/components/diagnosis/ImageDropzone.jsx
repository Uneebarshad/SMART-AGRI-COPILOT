import { useState } from 'react';
import { useT } from '../../i18n/useT';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { CameraIcon } from '../ui/icons/CameraIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';

/**
 * Capture surface (frontend-spec.md §7.1/§7.2): the page owns the native
 * `<input type="file" accept="image/jpeg,image/png,image/webp"
 * capture="environment">` (§7.1) — no custom camera UI — and hands its trigger
 * in via `onOpenPicker`, so the same picker serves "Replace" from the preview
 * state. On mobile `capture` offers the rear camera; on desktop files can also
 * be dragged onto the zone. The visible button stays the accessible,
 * keyboard-operable path (§19.3).
 */
export function ImageDropzone({ onFileSelected, onOpenPicker }) {
  const { t } = useT();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        dragging ? 'border-field-600 bg-field-50 dark:border-field-500/40 dark:bg-field-900/15' : 'border-soil-300 dark:border-soil-200 bg-surface',
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
        <LeafIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold text-soil-900">
        {t('diagnosis.dropzoneTitle')}
      </h2>
      <p className="mt-1 text-sm text-soil-500">{t('diagnosis.dropzoneHint')}</p>
      <Button className="mt-5" onClick={onOpenPicker}>
        <CameraIcon className="h-4 w-4" />
        {t('diagnosis.dropzoneAction')}
      </Button>
    </div>
  );
}
