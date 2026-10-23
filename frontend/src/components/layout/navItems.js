import { SproutIcon } from '../ui/icons/SproutIcon';
import { ChatIcon } from '../ui/icons/ChatIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { SettingsIcon } from '../ui/icons/SettingsIcon';
import { MapPinIcon } from '../ui/icons/MapPinIcon';
import { ConversationsIcon } from '../ui/icons/ConversationsIcon';
import { BellIcon } from '../ui/icons/BellIcon';
import { ChartIcon } from '../ui/icons/ChartIcon';
import { BugIcon } from '../ui/icons/BugIcon';
import { HomeIcon } from '../ui/icons/HomeIcon';
import { CalendarIcon } from '../ui/icons/CalendarIcon';

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
  { id: 'history', path: '/conversations', labelKey: 'nav.conversations', icon: ConversationsIcon },
  { id: 'notifications', path: '/notifications', labelKey: 'nav.notifications', icon: BellIcon },
];

/**
 * Desktop sidebar order mirrors the reference design: the whole product
 * surface in one list. Every path is an existing route — Conversations
 * lands on the history list. Notifications is intentionally NOT listed
 * here: the header bell (and the sidebar's own bell) is the access point,
 * and dropping the duplicate row keeps the list inside laptop heights.
 */
export const SIDEBAR_ITEMS = [
  { id: 'home', path: '/', labelKey: 'nav.dashboard', icon: HomeIcon },
  { id: 'fields', path: '/fields', labelKey: 'nav.fields', icon: MapPinIcon },
  { id: 'assistant', path: '/assistant', labelKey: 'nav.assistant', icon: ChatIcon },
  { id: 'diagnosis', path: '/diagnosis', labelKey: 'nav.diagnosis', icon: LeafIcon },
  { id: 'crop-recommendation', path: '/crop-recommendation', labelKey: 'nav.recommendations', icon: ChartIcon },
  { id: 'weather', path: '/weather', labelKey: 'nav.weather', icon: CloudRainIcon },
  { id: 'history', path: '/history', labelKey: 'nav.conversations', icon: CalendarIcon },
];
