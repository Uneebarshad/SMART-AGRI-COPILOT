import { useT } from '../../i18n/useT';
import { Button } from '../ui/Button';

/**
 * Selected-photo state (frontend-spec.md §7.2): the preview renders in a fixed
 * 4:3 frame via the object URL, with explicit "Remove" (clears state and
 * revokes the URL) and "Replace" (reopens the picker) actions.
 */
export function ImagePreview({ photo, analyzing = false, onRemove, onReplace }) {
  const { t } = useT();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-soil-200 bg-surface shadow-card">
        <div className="aspect-[4/3] w-full">
          <img
            src={photo.objectUrl}
            alt={t('diagnosis.previewAlt')}
            className="h-full w-full object-cover"
          />
        </div>
        {analyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 dark:bg-black/60" aria-hidden="true">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white motion-reduce:animate-none" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onReplace}>
          {t('diagnosis.replace')}
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          {t('diagnosis.remove')}
        </Button>
      </div>
    </div>
  );
}
