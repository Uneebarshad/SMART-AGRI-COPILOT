import { useCallback, useEffect, useState } from 'react';

/**
 * Generic server-data hook (frontend-spec.md §14.4): exposes
 * { data, status, retry } for a zero-argument fetcher returning a promise.
 * Pass a stable reference (useCallback or a module-level function) so the
 * effect doesn't re-run on every render. The fetcher comes from
 * `src/services/api.js` — components never fetch directly.
 */
export function useApi(fetcher) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data,
    status,
    retry,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
  };
}
