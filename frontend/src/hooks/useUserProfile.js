import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCurrentUser, updateCurrentUser } from '../services/api';

/*
 * Preference key mapping between frontend camelCase and backend snake_case.
 * The backend stores all preferences in a single JSON `preferences` column;
 * the frontend uses camelCase for React state.  These two helpers convert
 * between the two representations.
 */

const PREF_KEY_MAP = {
  temperatureUnit: 'temperature_unit',
  dateFormat: 'date_format',
  defaultLocation: 'default_location',
  cropType: 'crop_type',
  farmLocation: 'farm_location',
  weatherAlerts: 'weather_alerts',
  dailySummary: 'daily_summary',
  severeAlerts: 'severe_alerts',
  irrigationReminder: 'irrigation_reminder',
  recommendations: 'recommendations',
  notificationWeatherAlerts: 'notification_weather_alerts',
  farmingRecommendations: 'farming_recommendations',
};

/** Backend snake_case -> frontend camelCase */
export function fromBackendPrefs(prefs) {
  if (!prefs || typeof prefs !== 'object') return {};
  const out = {};
  for (const [feKey, beKey] of Object.entries(PREF_KEY_MAP)) {
    if (beKey in prefs) out[feKey] = prefs[beKey];
  }
  return out;
}

/** Frontend camelCase -> backend snake_case */
export function toBackendPrefs(prefs) {
  if (!prefs || typeof prefs !== 'object') return {};
  const out = {};
  for (const [feKey, beKey] of Object.entries(PREF_KEY_MAP)) {
    if (feKey in prefs) out[beKey] = prefs[feKey];
  }
  return out;
}

/**
 * User-profile hook: loads the current user from the backend on mount and
 * exposes a `save` function that PATCHes partial updates.
 *
 * Returns `{ user, status, error, save, retry }`.
 */
export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus('loading');
    setError(null);

    fetchCurrentUser()
      .then((data) => {
        if (!ctrl.signal.aborted) {
          setUser(data);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (!ctrl.signal.aborted) {
          setError(err);
          setStatus('error');
        }
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  /**
   * PATCH the backend with a partial payload.  On success the local `user`
   * state is updated with the response so the UI stays in sync.
   * Returns the backend response or throws on failure.
   */
  const save = useCallback(
    async (payload) => {
      const updated = await updateCurrentUser(payload);
      setUser(updated);
      return updated;
    },
    [],
  );

  return { user, status, error, save, retry: load };
}
