import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import { fetchScan } from '../services/api';
import { ensureSeeded, loadScan } from '../lib/localScans';
import { SEED_SCAN } from './diagnosisFixtures';

// Backend GET /api/diagnosis/scans/{id} is live.
// Fixtures kept for reference but no longer used.
const USE_FIXTURE = false;

/** Fixture path: trilingual bundle → display shape for the active language. */
function bundleToScan(detail, lang) {
  const result = detail.result?.[lang] ?? detail.result?.en ?? {};
  const diagnosed = Boolean(result.disease);
  return {
    id: detail.id,
    status: diagnosed ? 'diagnosed' : detail.result?.en?.retake_tips ? 'uncertain' : 'healthy',
    crop: detail.crop ?? null,
    createdAt: detail.created_at,
    disease: result.disease ?? null,
    confidence: diagnosed ? result.confidence : null,
    severity: diagnosed ? result.severity : null,
    symptoms: result.symptoms ?? [],
    treatmentSteps: result.treatment_steps ?? [],
    prevention: result.prevention ?? [],
    careTips: result.care_tips ?? [],
    imageUrl: null,
  };
}

/** Real API path: §15.6 response → display shape.
 *  Backend returns flat fields (disease_id, disease_name); the UI expects
 *  a nested `disease: { id, name }` object, so we build it here. */
function responseToScan(response) {
  const diagnosed = response.status === 'diagnosed';
  const disease =
    diagnosed && (response.disease_id || response.disease_name)
      ? { id: response.disease_id ?? null, name: response.disease_name ?? null }
      : null;
  return {
    id: response.id,
    status: response.status,
    crop: response.crop ?? null,
    createdAt: response.created_at,
    disease,
    confidence: diagnosed ? response.confidence : null,
    severity: diagnosed ? response.severity : null,
    symptoms: diagnosed ? (response.symptoms ?? []) : [],
    treatmentSteps: diagnosed ? (response.treatment_steps ?? []) : [],
    prevention: diagnosed ? (response.prevention ?? []) : [],
    careTips: response.care_tips ?? [],
    imageUrl: response.image_url ?? null,
  };
}

/**
 * Saved-scan loader for /diagnosis/:scanId (§5.4): read-only — it never
 * re-runs analysis, it only fetches what was stored.
 */
export function useScanResult(scanId) {
  const { lang } = useT();
  const [scan, setScan] = useState(null);
  // 'idle' | 'loading' | 'success' | 'missing' | 'error'
  const [loadStatus, setLoadStatus] = useState('idle');

  const mountedRef = useRef(true);
  const sequenceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    (id) => {
      const sequence = ++sequenceRef.current;
      setLoadStatus('loading');
      const loadPromise = USE_FIXTURE
        ? Promise.resolve().then(() => {
            ensureSeeded(SEED_SCAN);
            return loadScan(id);
          })
        : fetchScan(id, lang);

      loadPromise
        .then((detail) => {
          if (!mountedRef.current || sequence !== sequenceRef.current) return;
          setScan(USE_FIXTURE ? bundleToScan(detail, lang) : responseToScan(detail));
          setLoadStatus('success');
        })
        .catch((error) => {
          if (!mountedRef.current || sequence !== sequenceRef.current) return;
          setLoadStatus(error?.code === 'not_found' ? 'missing' : 'error');
        });
    },
    [lang],
  );

  useEffect(() => {
    if (scanId) {
      load(scanId);
    }
  }, [scanId, load]);

  const retry = useCallback(() => {
    if (scanId) {
      load(scanId);
    }
  }, [scanId, load]);

  return { scan, loadStatus, retry };
}
