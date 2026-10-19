const LOCALE_TAGS = { en: 'en-GB', ur: 'ur-u-nu-latn', 'ur-Latn': 'en-GB' };

function localeTag(lang) {
  return LOCALE_TAGS[lang] ?? 'en-GB';
}

/** "12 Mar 2026"-style date; Urdu renders in Urdu script and digits. */
export function formatDate(value, lang = 'en') {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(localeTag(lang), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/** Locale-aware numbers — Western digits in every locale (Appendix A9). */
export function formatNumber(value, lang = 'en') {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  try {
    return new Intl.NumberFormat(localeTag(lang)).format(value);
  } catch {
    return String(value);
  }
}

/** Chat-style clock time, Western digits in every locale (Appendix A9). */
export function formatTime(value, lang = 'en') {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(localeTag(lang), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Chat-style relative stamp ("2h ago", "3d ago") for activity rows;
 * anything older falls back to the short calendar date.
 */
export function relativeTime(value, lang = 'en') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date, lang);
}
