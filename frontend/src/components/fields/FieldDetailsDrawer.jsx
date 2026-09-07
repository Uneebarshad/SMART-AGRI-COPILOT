import { Card } from '../ui';
import { CalendarIcon } from '../ui/icons/CalendarIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { EditIcon } from '../ui/icons/EditIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';
import { ThermometerIcon } from '../ui/icons/ThermometerIcon';
import { TrashIcon } from '../ui/icons/TrashIcon';
import { Button } from '../ui';
import { FieldDrawer } from './FieldDrawer';
import { FieldStatusChip } from './FieldStatusChip';

const formatDate = (date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`),
  );

function InfoRow({ label, value, Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-soil-100 py-3 last:border-0">
      <dt className="flex items-center gap-2 text-sm text-soil-500">
        {Icon && <Icon className="h-4 w-4 text-soil-400" />}
        {label}
      </dt>
      <dd className="text-end text-sm font-medium text-soil-800">{value}</dd>
    </div>
  );
}

export function FieldDetailsDrawer({ field, onClose, onEdit, onDelete }) {
  if (!field) return null;

  return (
    <FieldDrawer
      open={Boolean(field)}
      onClose={onClose}
      title={field.name}
      description="Field details and recent observations"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onDelete(field)}>
            <TrashIcon className="h-4 w-4" /> Delete field
          </Button>
          <Button onClick={() => onEdit(field)}>
            <EditIcon className="h-4 w-4" /> Edit field
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FieldStatusChip status={field.status} />
          <span className="text-xs text-soil-500">Updated {field.lastUpdated}</span>
        </div>

        <dl className="rounded-lg border border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 px-4">
          <InfoRow label="Location" value={field.location} Icon={MapPinIcon} />
          <InfoRow label="Area" value={`${field.area} acres`} />
          <InfoRow label="Crop" value={field.crop} Icon={SproutIcon} />
          <InfoRow label="Growth stage" value={field.growthStage} />
          <InfoRow label="Planting date" value={formatDate(field.plantingDate)} Icon={CalendarIcon} />
          <InfoRow label="Harvest date" value={formatDate(field.harvestDate)} Icon={CalendarIcon} />
          <InfoRow label="Irrigation" value={field.irrigationMethod} Icon={DropletIcon} />
        </dl>

        <section>
          <h3 className="text-sm font-semibold text-soil-900">Soil snapshot</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['pH', field.soil.ph],
              ['Moisture', field.soil.moisture],
              ['Organic matter', field.soil.organicMatter],
            ].map(([label, value]) => (
              <Card key={label} className="p-3">
                <p className="text-xs text-soil-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-soil-800">{value}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-soil-900">Weather</h3>
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-800 dark:border-sky-500/30 dark:bg-sky-900/15 dark:text-sky-400">
            <CloudRainIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Local weather is not connected</p>
              <p className="mt-1 text-xs text-sky-700 dark:text-sky-400/80">Weather readings will appear here when a weather source is added.</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-soil-200 bg-surface p-3">
              <ThermometerIcon className="h-4 w-4 text-soil-400" />
              <p className="mt-2 text-xs text-soil-500">Temperature</p>
              <p className="mt-1 text-sm font-semibold text-soil-800">—</p>
            </div>
            <div className="rounded-lg border border-soil-200 bg-surface p-3">
              <DropletIcon className="h-4 w-4 text-soil-400" />
              <p className="mt-2 text-xs text-soil-500">Rain chance</p>
              <p className="mt-1 text-sm font-semibold text-soil-800">—</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-soil-900">Notes</h3>
          <p className="mt-2 rounded-lg border border-soil-200 dark:border-soil-200 bg-soil-50 dark:bg-soil-200 p-4 text-sm leading-relaxed text-soil-700">
            {field.notes || 'No notes have been added for this field.'}
          </p>
        </section>
      </div>
    </FieldDrawer>
  );
}
