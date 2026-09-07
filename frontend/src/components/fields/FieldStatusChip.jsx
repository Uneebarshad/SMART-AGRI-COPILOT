import { Badge } from '../ui';
import { AlertTriangleIcon } from '../ui/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../ui/icons/CheckCircleIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';

const STATUS_META = {
  Healthy: { tone: 'success', Icon: CheckCircleIcon },
  'Needs Attention': { tone: 'warning', Icon: AlertTriangleIcon },
  'Recently Planted': { tone: 'info', Icon: SproutIcon },
  'Ready for Harvest': { tone: 'success', Icon: LeafIcon },
};

export function FieldStatusChip({ status }) {
  const { tone, Icon } = STATUS_META[status] ?? { tone: 'neutral', Icon: CheckCircleIcon };
  return (
    <Badge tone={tone}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </Badge>
  );
}

export { STATUS_META };
