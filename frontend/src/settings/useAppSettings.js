import { useContext } from 'react';
import { AppSettingsContext } from './AppSettingsProvider';

/**
 * App settings hook (frontend-spec.md §14.2).
 * Returns { onboarded, district, setDistrict, completeOnboarding, resetOnboarding }.
 */
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
