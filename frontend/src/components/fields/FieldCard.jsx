import { Card } from '../ui';
import { CalendarIcon } from '../ui/icons/CalendarIcon';
import { ChartIcon } from '../ui/icons/ChartIcon';
import { EditIcon } from '../ui/icons/EditIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { TrashIcon } from '../ui/icons/TrashIcon';
import { FieldStatusChip } from './FieldStatusChip';

const formatDate = (date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  );

export function FieldCard({ field, onOpen, onEdit, onDelete }) {
  return (
    <Card className="flex h-full flex-col">
      <button
        type="button"
        onClick={() => onOpen(field)}
        className="flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-soil-900">{field.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-soil-600">
              <MapPinIcon className="h-4 w-4 shrink-0 text-soil-400" />
              {field.location}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-field-50 text-field-700 dark:bg-field-900/20 dark:text-field-400">
            <LeafIcon className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-soil-100 dark:border-soil-200 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-soil-500">
              <ChartIcon className="h-3.5 w-3.5" /> Area
            </p>
            <p className="mt-1 text-sm font-semibold text-soil-800">{field.area} acres</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-soil-500">
              <SproutIcon className="h-3.5 w-3.5" /> Crop
            </p>
            <p className="mt-1 text-sm font-semibold text-soil-800">{field.crop}</p>
          </div>
          <div>
            <p className="text-xs text-soil-500">Growth stage</p>
            <p className="mt-1 text-sm font-semibold text-soil-800">{field.growthStage}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs text-soil-500">
              <CalendarIcon className="h-3.5 w-3.5" /> Harvest
            </p>
            <p className="mt-1 text-sm font-semibold text-soil-800">{formatDate(field.harvestDate)}</p>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm font-medium text-field-700 dark:text-field-400">
          View full field details <span aria-hidden="true">→</span>
        </p>
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-soil-100 dark:border-soil-200 pt-3">
        <div>
          <FieldStatusChip status={field.status} />
          <p className="mt-2 text-xs text-soil-500">Updated {field.lastUpdated}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(field)}
            aria-label={`Edit ${field.name}`}
            className="flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-soil-700 transition-colors hover:bg-soil-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
          >
            <EditIcon className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(field)}
            aria-label={`Delete ${field.name}`}
            className="flex h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-rust-700 transition-colors hover:bg-rust-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-600 focus-visible:ring-offset-2 dark:text-rust-400 dark:hover:bg-rust-900/15"
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </Card>
  );
}
