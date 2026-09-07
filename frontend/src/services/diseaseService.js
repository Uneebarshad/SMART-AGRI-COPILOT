import { fetchDiseases, fetchDiseaseById } from './api';
import { MOCK_DISEASES } from '../data/diseasesMock';

/**
 * Disease library service — uses the real FastAPI + PostgreSQL backend.
 * Falls back to local fixtures if the API is unavailable.
 */

let _cachedDiseases = null;
let _cachePromise = null;

function normalizeDisease(disease) {
  return {
    id: disease.slug ?? String(disease.id),
    name: disease.name,
    crop: disease.crop,
    type: disease.type ?? disease.disease_type ?? '',
    severity: disease.severity,
    description: disease.description,
    symptoms: disease.symptoms ?? [],
    causes: disease.causes ?? [],
    prevention: disease.prevention ?? [],
    recommendedActions: disease.recommended_actions ?? [],
    commonness: disease.commonness ?? 5,
  };
}

/** Fetch all diseases from the backend, with in-memory caching. */
export async function getDiseases() {
  if (_cachedDiseases) return _cachedDiseases;
  if (!_cachePromise) {
    _cachePromise = fetchDiseases()
      .then((diseases) => {
        _cachedDiseases = diseases.map(normalizeDisease);
        return _cachedDiseases;
      })
      .catch(() => {
        // Fall back to local fixtures if the API is unavailable
        _cachedDiseases = MOCK_DISEASES;
        return _cachedDiseases;
      })
      .finally(() => {
        _cachePromise = null;
      });
  }
  return _cachePromise;
}

/** Fetch a single disease by its slug/id. */
export async function getDisease(id) {
  // First check the cached list
  const diseases = await getDiseases();
  const fromCache = diseases.find((d) => d.id === id);
  if (fromCache) return fromCache;

  // If not found in cache, try the API directly
  try {
    const disease = await fetchDiseaseById(id);
    return normalizeDisease(disease);
  } catch {
    // Fall back to mock data
    return MOCK_DISEASES.find((d) => d.id === id) ?? null;
  }
}

export function searchDiseases(query, diseases) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return diseases;

  return diseases.filter((disease) => [
    disease.name,
    disease.crop,
    disease.type,
    disease.severity,
    disease.description,
    ...disease.symptoms,
  ].some((value) => value.toLowerCase().includes(normalizedQuery)));
}

export function filterDiseases(diseases, filters = {}) {
  return diseases.filter((disease) => (
    (!filters.crop || filters.crop === 'all' || disease.crop === filters.crop) &&
    (!filters.type || filters.type === 'all' || disease.type === filters.type) &&
    (!filters.severity || filters.severity === 'all' || disease.severity === filters.severity)
  ));
}
