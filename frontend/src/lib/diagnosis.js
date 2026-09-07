/**
 * Pure diagnosis domain helpers (frontend-spec.md §7.4, §19.1): confidence
 * tiering, badge-tone mapping and crop labels — no React, no DOM, so they stay
 * portable and unit-testable.
 */

/** High ≥ 0.80 · Medium 0.60–0.79 · Low < 0.60 (§7.4). */
export function getConfidenceTier(confidence) {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

export const CONFIDENCE_TONES = { high: 'success', medium: 'warning', low: 'danger' };

/** Low → neutral · Moderate → warning · High → danger (§7.4 header row). */
export const SEVERITY_TONES = { low: 'neutral', moderate: 'warning', high: 'danger' };

/** Crop select options (§7.2) and their i18n labels. */
export const CROP_VALUES = ['wheat', 'cotton', 'maize', 'rice', 'other'];

export function cropLabelKey(crop) {
  const CROP_LABEL_KEYS = {
    wheat: 'diagnosis.cropWheat',
    cotton: 'diagnosis.cropCotton',
    maize: 'diagnosis.cropMaize',
    rice: 'diagnosis.cropRice',
    other: 'diagnosis.cropOther',
  };
  return CROP_LABEL_KEYS[crop] ?? null;
}
