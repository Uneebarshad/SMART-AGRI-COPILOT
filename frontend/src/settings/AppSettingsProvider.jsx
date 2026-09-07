import { createContext, useCallback, useMemo, useState } from 'react';
import { storage } from '../lib/storage';

const ONBOARDED_KEY = 'agri.onboarded';
const DISTRICT_KEY = 'agri.district';

const AppSettingsContext = createContext(null);

/**
 * App-wide settings (frontend-spec.md §14.2): the onboarding flag and district.
 * Owns the `agri.onboarded` / `agri.district` keys through the storage seam —
 * UI components never touch localStorage directly. Language (`agri.lang`)
 * stays owned by I18nProvider.
 */
export function AppSettingsProvider({ children }) {
  const [onboarded, setOnboarded] = useState(() => storage.get(ONBOARDED_KEY) === 'true');
  const [district, setDistrictState] = useState(() => storage.get(DISTRICT_KEY) ?? null);

  const setDistrict = useCallback((value) => {
    setDistrictState(value);
    storage.set(DISTRICT_KEY, value);
  }, []);

  /** Finish onboarding (frontend-spec.md §5.1): persists district + flag. */
  const completeOnboarding = useCallback(
    (districtValue) => {
      if (districtValue !== undefined && districtValue !== null) {
        setDistrict(districtValue);
      }
      setOnboarded(true);
      storage.set(ONBOARDED_KEY, 'true');
    },
    [setDistrict],
  );

  /** Support for Settings → "Replay intro" (spec §5.1 entry point). */
  const resetOnboarding = useCallback(() => {
    setOnboarded(false);
    storage.remove(ONBOARDED_KEY);
  }, []);

  const value = useMemo(
    () => ({ onboarded, district, setDistrict, completeOnboarding, resetOnboarding }),
    [onboarded, district, setDistrict, completeOnboarding, resetOnboarding],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export { AppSettingsContext };
