import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/useT';
import { analyzeDiagnosis, fetchScans } from '../services/api';
import { validateImageFile } from '../lib/imageFile';
import { ensureSeeded, listScans, saveScan, setScanPhoto } from '../lib/localScans';
import { buildScanResponse, pickScanKind, SEED_SCAN } from './diagnosisFixtures';

// Backend POST /api/diagnosis/analyze is now live with Gemini Vision.
// Fixtures kept for reference but no longer used.
const USE_FIXTURE = false;

// Long enough to demonstrate the staged progress UI (§7.3).
const FIXTURE_DELAY_MS = 7000;

function abortError() {
  const error = new Error('cancelled');
  error.name = 'AbortError';
  return error;
}

/** Fake POST /api/diagnosis/analyze (§15.6): latency + canned trilingual results. */
function fixtureAnalyze({ crop, notes, language, signal }) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      resolve(buildScanResponse(pickScanKind({ crop, notes }), language));
    }, FIXTURE_DELAY_MS);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function humanizeError(error) {
  return error?.message || 'Something went wrong';
}

function isRetryable(error) {
  // §7.6: network failures, timeouts and server errors retry; only backend
  // validation (400/422, §15.2) does not.
  if (!error?.status) return true;
  return error.status !== 400 && error.status !== 422;
}

/**
 * Capture-screen state (frontend-spec.md §7.1–§7.3): owns the selected photo
 * (validated before anything uploads), the optional crop/note form, the
 * analysis lifecycle (staged, cancellable) and the "Past scans" list.
 */
export function useDiagnosis() {
  const { lang } = useT();

  const [photo, setPhoto] = useState(null); // { file, objectUrl }
  const [crop, setCrop] = useState('');
  const [notes, setNotes] = useState('');
  const [validationKey, setValidationKey] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [pastScans, setPastScans] = useState([]);
  const [pastScansError, setPastScansError] = useState(false);

  const mountedRef = useRef(true);
  const validationSequenceRef = useRef(0);
  const abortRef = useRef(null);
  const photoRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Revoke the pending preview when leaving the screen (Appendix A10).
  useEffect(
    () => () => {
      if (photoRef.current) {
        URL.revokeObjectURL(photoRef.current.objectUrl);
      }
    },
    [],
  );

  const loadPastScans = useCallback(() => {
    if (!USE_FIXTURE) {
      fetchScans(lang)
        .then((list) => {
          if (mountedRef.current) {
            setPastScans(Array.isArray(list) ? list : list?.scans ?? []);
            setPastScansError(false);
          }
        })
        .catch(() => {
          if (mountedRef.current) setPastScansError(true);
        });
      return;
    }
    ensureSeeded(SEED_SCAN);
    setPastScans(listScans());
    setPastScansError(false);
  }, [lang]);

  useEffect(() => {
    loadPastScans();
  }, [loadPastScans]);

  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);

  /**
   * Validates and adopts a selected image (dropzone pick, drag-and-drop, or
   * the assistant's §6.5 hand-off, which arrives with its own object URL).
   */
  const selectImage = useCallback(async (file, existingObjectUrl) => {
    const sequence = ++validationSequenceRef.current;
    setValidationKey(null);
    const reason = await validateImageFile(file);
    if (!mountedRef.current || sequence !== validationSequenceRef.current) return;
    if (reason) {
      if (existingObjectUrl) URL.revokeObjectURL(existingObjectUrl);
      setValidationKey(reason);
      return;
    }
    const objectUrl = existingObjectUrl ?? URL.createObjectURL(file);
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.objectUrl);
      return { file, objectUrl };
    });
  }, []);

  /** "Remove" clears the capture state and revokes the preview (§7.2). */
  const removeImage = useCallback(() => {
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current.objectUrl);
      return null;
    });
    setValidationKey(null);
    setCrop('');
    setNotes('');
  }, []);

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /**
   * Runs the analysis (§7.3). On success the photo's object URL moves into the
   * session registry (Appendix A10) so the result screen can show it; resolves
   * to the new scan id, or undefined when it failed or was cancelled.
   */
  const analyze = useCallback(async () => {
    if (!photo || analyzing) return undefined;
    setAnalysisError(null);
    setAnalyzing(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const outcome = USE_FIXTURE
        ? await fixtureAnalyze({ crop, notes, language: lang, signal: controller.signal })
        : await analyzeDiagnosis({
            image: photo.file,
            crop: crop || undefined,
            notes: notes.trim() || undefined,
            language: lang,
            signal: controller.signal,
          });

      if (!mountedRef.current) return undefined;
      const scanId = USE_FIXTURE ? outcome.response.id : outcome.id;
      if (USE_FIXTURE) {
        saveScan({
          id: scanId,
          crop: crop || 'other',
          created_at: USE_FIXTURE ? outcome.response.created_at : outcome.created_at,
          result: outcome.bundle,
        });
      }
      setScanPhoto(scanId, photo.objectUrl);
      photoRef.current = null; // ownership of the URL moves to the registry
      setPhoto(null);
      return scanId;
    } catch (error) {
      if (mountedRef.current && error?.name !== 'AbortError') {
        setAnalysisError({ message: humanizeError(error), retryable: isRetryable(error) });
      }
      return undefined;
    } finally {
      abortRef.current = null;
      if (mountedRef.current) setAnalyzing(false);
    }
  }, [photo, analyzing, crop, notes, lang]);

  return {
    photo,
    crop,
    notes,
    validationKey,
    analyzing,
    analysisError,
    pastScans,
    pastScansError,
    setCrop,
    setNotes,
    selectImage,
    removeImage,
    analyze,
    cancelAnalysis,
    retryPastScans: loadPastScans,
  };
}
