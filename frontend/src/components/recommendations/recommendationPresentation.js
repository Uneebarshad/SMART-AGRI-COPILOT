import { BugIcon } from '../ui/icons/BugIcon';
import { ChartIcon } from '../ui/icons/ChartIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { DropletIcon } from '../ui/icons/DropletIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';

export const CATEGORY_LABELS = {
  irrigation: 'Irrigation',
  'crop-care': 'Crop care',
  weather: 'Weather',
  'pest-disease': 'Pest & disease',
  fertilization: 'Fertilization',
  harvest: 'Harvest',
  general: 'General farming',
};

export const CATEGORY_ICONS = {
  irrigation: DropletIcon,
  'crop-care': LeafIcon,
  weather: CloudRainIcon,
  'pest-disease': BugIcon,
  fertilization: SproutIcon,
  harvest: SproutIcon,
  general: ChartIcon,
};

export const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
export const PRIORITY_TONES = { high: 'danger', medium: 'warning', low: 'neutral' };
export const STATUS_LABELS = { active: 'Active', completed: 'Completed' };
