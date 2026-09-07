import { useT } from '../../i18n/useT';
import { Button } from '../ui/Button';

/**
 * Photo hand-off confirmation (frontend-spec.md §6.5): after the attach button
 * selects an image, the assistant asks whether to run a leaf scan. Confirming
 * routes to /diagnosis with the photo preloaded (via location.state); the
 * conversation stays intact in history.
 */
export function PhotoHandoff({ photo, onConfirm, onCancel }) {
  const { t } = useT();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-soil-200 bg-surface p-3 shadow-card">
      <img
        src={photo.objectUrl}
        alt={t('assistant.photoAlt')}
        className="h-14 w-14 shrink-0 rounded-lg border border-soil-200 object-cover"
      />
      <p className="min-w-40 flex-1 text-sm font-medium text-soil-800">{t('assistant.photoQuestion')}</p>
      <div className="flex w-full gap-2 sm:w-auto">
        <Button className="flex-1 sm:flex-none" onClick={onConfirm}>
          {t('assistant.photoConfirm')}
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCancel}>
          {t('assistant.photoCancel')}
        </Button>
      </div>
    </div>
  );
}
