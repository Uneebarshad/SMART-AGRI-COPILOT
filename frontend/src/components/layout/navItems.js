import { SproutIcon } from '../ui/icons/SproutIcon';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { SettingsIcon } from '../ui/icons/SettingsIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { CalendarIcon } from '../ui/icons/CalendarIcon';
import { ChartIcon } from '../ui/icons/ChartIcon';
import { BugIcon } from '../ui/icons/BugIcon';

/**
 * Single source of navigation structure (frontend-spec.md §4.3).
 * Primary nav items appear in the sidebar and bottom nav.
 * Secondary items appear below the divider in the sidebar and mobile menu.
 * Navigation icons stay neutral gray; the green accent is reserved for the
 * active item, so no per-item tone data is needed here.
 */
export const NAV_ITEMS = [
  { id: 'home', path: '/', labelKey: 'nav.home', icon: SproutIcon },
  { id: 'assistant', path: '/assistant', labelKey: 'nav.assistant', icon: ChatIcon },
  { id: 'diagnosis', path: '/diagnosis', labelKey: 'nav.diagnosis', icon: LeafIcon },
  { id: 'weather', path: '/weather', labelKey: 'nav.weather', icon: CloudRainIcon },
  { id: 'settings', path: '/settings', labelKey: 'nav.settings', icon: SettingsIcon },
];

export const SECONDARY_ITEMS = [
  { id: 'fields', path: '/fields', labelKey: 'nav.fields', icon: MapPinIcon },
  { id: 'crop-recommendation', path: '/crop-recommendation', labelKey: 'nav.recommendations', icon: ChartIcon },
  { id: 'diseases', path: '/diseases', labelKey: 'nav.diseases', icon: BugIcon },
  { id: 'history', path: '/history', labelKey: 'nav.history', icon: CalendarIcon },
];
