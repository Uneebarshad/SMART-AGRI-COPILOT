import { storage } from './storage';

/**
 * Local-first scan store (frontend-spec.md §7.5, Appendix A5): stands in for
 * GET /api/diagnosis/scans (§15.6) while the backend is absent. Details keep
 * the trilingual fixture bundles; list entries carry just enough for the
 * "Past scans" rows. Per Appendix A10 no photo bytes are persisted — only a
 * session-scoped object-URL registry (plain memory, dies with the tab).
 */

const LIST_KEY = 'agri.scans';
const ITEM_KEY_PREFIX = 'agri.scan.';
const MAX_SCANS = 20;

// Session-only object URLs for recently analyzed photos (Appendix A10).
const scanPhotos = new Map();

export function setScanPhoto(scanId, objectUrl) {
  const previous = scanPhotos.get(scanId);
  if (previous && previous !== objectUrl) {
    URL.revokeObjectURL(previous);
  }
  scanPhotos.set(scanId, objectUrl);
}

export function getScanPhoto(scanId) {
  return scanPhotos.get(scanId) ?? null;
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readList() {
  return parseJson(storage.get(LIST_KEY)) ?? [];
}

function writeList(list) {
  storage.set(LIST_KEY, JSON.stringify(list));
}

function readItem(id) {
  return parseJson(storage.get(`${ITEM_KEY_PREFIX}${id}`));
}

function writeItem(scan) {
  storage.set(`${ITEM_KEY_PREFIX}${scan.id}`, JSON.stringify(scan));
}

function listEntryFrom(scan) {
  const diagnosed = scan.result.en.disease ? scan.result.en : null;
  return {
    id: scan.id,
    status: diagnosed ? 'diagnosed' : scan.result.en.status,
    crop: scan.crop,
    confidence: diagnosed ? diagnosed.confidence : null,
    created_at: scan.created_at,
    disease_localized: diagnosed
      ? {
          en: diagnosed.disease.name,
          ur: (scan.result.ur ?? {}).disease?.name ?? diagnosed.disease.name,
          'ur-Latn': (scan.result['ur-Latn'] ?? {}).disease?.name ?? diagnosed.disease.name,
        }
      : null,
  };
}

/**
 * Saves (or upserts) one scan: full trilingual detail item + list entry.
 * `scan` shape: { id, crop, created_at, result: { en, ur, 'ur-Latn' } }.
 */
export function saveScan(scan) {
  writeItem(scan);
  const list = readList().filter((entry) => entry.id !== scan.id);
  list.push(listEntryFrom(scan));
  writeList(list.slice(-MAX_SCANS));
  return scan;
}

/** Idempotent: writes a demo scan once so /diagnosis/s-202 resolves. */
export function ensureSeeded(seed) {
  if (!readItem(seed.id)) {
    writeItem(seed);
    const list = readList();
    if (!list.some((entry) => entry.id === seed.id)) {
      list.push(listEntryFrom(seed));
      writeList(list);
    }
  }
}

/**
 * Past-scan list for the capture screen and History (§7.5): newest first,
 * [{ id, status, crop, confidence, created_at, disease_localized }].
 */
export function listScans() {
  return readList().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/**
 * Saved scan detail for /diagnosis/:scanId: { id, crop, created_at, result }.
 * Throws an error with `code: 'not_found'` when the id is unknown.
 */
export function loadScan(id) {
  const scan = readItem(id);
  if (!scan) {
    const error = new Error('Scan not found');
    error.code = 'not_found';
    throw error;
  }
  return scan;
}
