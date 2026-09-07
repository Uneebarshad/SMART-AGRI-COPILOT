import { Button } from '../ui';
import { TrashIcon } from '../ui/icons/TrashIcon';
import { FieldDrawer } from './FieldDrawer';

export function DeleteFieldDialog({ field, onClose, onConfirm, deleting = false }) {
  if (!field) return null;

  return (
    <FieldDrawer
      open={Boolean(field)}
      onClose={onClose}
      centered
      title="Delete field?"
      description="This only removes the field from this local demo."
      panelClassName="p-0"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(field)} disabled={deleting}>
            <TrashIcon className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete field'}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 text-sm text-soil-700">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400">
          <TrashIcon className="h-5 w-5" />
        </span>
        <p>
          Are you sure you want to remove <strong className="font-semibold text-soil-900">{field.name}</strong>?
          Its local notes and tracking details will be removed from this page.
        </p>
      </div>
    </FieldDrawer>
  );
}
