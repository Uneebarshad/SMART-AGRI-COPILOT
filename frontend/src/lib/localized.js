/**
 * Picks the string for the active language from a localized content object
 * (frontend-spec.md §15.2: `*_localized` fields). English is the fallback;
 * plain strings pass through untouched.
 */
export function pickLocalized(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.en ?? '';
}
