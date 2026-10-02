import { AlertTriangleIcon } from '../ui/icons/AlertTriangleIcon';
import { BugIcon } from '../ui/icons/BugIcon';
import { CloudRainIcon } from '../ui/icons/CloudRainIcon';
import { LeafIcon } from '../ui/icons/LeafIcon';
import { SproutIcon } from '../ui/icons/SproutIcon';

/**
 * Presentation map for notification types (mirrors the backend `type`
 * column). Green = agriculture/success events, blue = information, rust =
 * warnings — never color alone: each row also shows a "New" pill when unread.
 */
export const NOTIFICATION_TYPES = {
  weather: { Icon: CloudRainIcon, tile: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
  disease: { Icon: BugIcon, tile: 'bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400' },
  success: { Icon: SproutIcon, tile: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400' },
  error: { Icon: AlertTriangleIcon, tile: 'bg-rust-100 text-rust-700 dark:bg-rust-900/20 dark:text-rust-400' },
  info: { Icon: LeafIcon, tile: 'bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400' },
};

export function typeMeta(type) {
  return NOTIFICATION_TYPES[type] ?? NOTIFICATION_TYPES.info;
}

/** Unit words per language: [minute, hour, day]. */
const AGO_WORDS = {
  en: { justNow: 'just now', min: 'min', hour: 'hour', hours: 'hours', day: 'day', days: 'days' },
  ur: { justNow: 'ابھی', min: 'منٹ', hour: 'گھنٹہ', hours: 'گھنٹے', day: 'دن', days: 'دن' },
  'ur-Latn': { justNow: 'abhi', min: 'minute', hour: 'ghanta', hours: 'ghantay', day: 'din', days: 'din' },
};

/** "10 min ago" style timestamp from an ISO string; '' when unparseable. */
export function formatRelativeTime(iso, lang = 'en') {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const words = AGO_WORDS[lang] ?? AGO_WORDS.en;
  const seconds = Math.max(0, Math.round((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return words.justNow;
  if (seconds < 3600) return agoText(Math.round(seconds / 60), words.min, lang);
  if (seconds < 86400) return agoText(Math.round(seconds / 3600), words.hour, lang);
  if (seconds < 604800) return agoText(Math.round(seconds / 86400), words.day, lang);
  return formatAbsolute(then, lang);
}

function agoText(value, unit, lang) {
  if (lang === 'en') return `${value} ${unit}${value === 1 ? '' : 's'} ago`;
  const suffix = lang === 'ur' ? 'پہلے' : 'pehle';
  return `${value} ${unit} ${suffix}`;
}

function formatAbsolute(date, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return '';
  }
}
