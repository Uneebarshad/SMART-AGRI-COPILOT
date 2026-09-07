import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { LANGUAGES } from '../i18n/I18nProvider';
import { useTheme } from '../theme/useTheme';
import { useAppSettings } from '../settings/useAppSettings';
import { useUserProfile, fromBackendPrefs, toBackendPrefs } from '../hooks/useUserProfile';
import { DISTRICTS, districtName } from '../lib/districts';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Badge,
  Banner,
  Button,
  Card,
  ErrorState,
  SelectField,
  Skeleton,
  TextField,
} from '../components/ui';
import { CalendarIcon } from '../components/ui/icons/CalendarIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { DropletIcon } from '../components/ui/icons/DropletIcon';
import { GlobeIcon } from '../components/ui/icons/GlobeIcon';
import { InfoIcon } from '../components/ui/icons/InfoIcon';
import { SettingsIcon } from '../components/ui/icons/SettingsIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { UserIcon } from '../components/ui/icons/UserIcon';

/* ------------------------------------------------------------------ */
/* Defaults & option lists                                             */
/* ------------------------------------------------------------------ */

const PREF_DEFAULTS = {
  temperatureUnit: 'C',
  dateFormat: 'DD MMM YYYY',
  defaultLocation: '',
  weatherAlerts: true,
  dailySummary: true,
  severeAlerts: true,
  cropType: 'Wheat',
  farmLocation: '',
  irrigationReminder: true,
  recommendations: true,
  notificationWeatherAlerts: true,
  farmingRecommendations: true,
};

const LANGUAGE_OPTIONS = LANGUAGES.map(({ code, label }) => ({ value: code, label }));
const TEMPERATURE_OPTIONS = [
  { value: 'C', label: 'Celsius (°C)' },
  { value: 'F', label: 'Fahrenheit (°F)' },
];
const DATE_OPTIONS = [
  { value: 'DD MMM YYYY', label: '12 Mar 2026' },
  { value: 'MMM DD, YYYY', label: 'Mar 12, 2026' },
  { value: 'YYYY-MM-DD', label: '2026-03-12' },
];
const CROP_OPTIONS = ['Wheat', 'Cotton', 'Maize', 'Rice', 'Sugarcane', 'Vegetables'];
const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System default' },
];
const DISTRICT_OPTIONS = DISTRICTS.map((d) => ({ value: d.id, label: d.name.en }));

/* ------------------------------------------------------------------ */
/* Presentational sub-components (unchanged)                           */
/* ------------------------------------------------------------------ */

function SettingsSection({ icon: Icon, title, description, id, iconTone = 'field', className = '', children }) {
  const TONE_CLASSES = {
    field: 'bg-field-100 dark:bg-field-900/20 text-field-700 dark:text-field-400',
    sky: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400',
    sun: 'bg-sun-100 dark:bg-sun-900/20 text-sun-700 dark:text-sun-400',
    ai: 'bg-ai-100 dark:bg-ai-900/20 text-ai-700 dark:text-ai-400',
    neutral: 'bg-soil-100 dark:bg-soil-200 text-soil-600 dark:text-soil-400',
    rust: 'bg-rust-100 dark:bg-rust-900/20 text-rust-700 dark:text-rust-400',
  };
  return (
    <Card id={id} className={className}>
      <div className="mb-5 flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[iconTone] || TONE_CLASSES.field}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-soil-600">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-soil-100 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-soil-800">{label}</p>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-soil-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2 ${
          checked ? 'border-field-600 bg-field-600' : 'border-soil-300 bg-soil-100'
        }`}
      >
        <span
          aria-hidden="true"
          className={`h-5 w-5 rounded-full bg-surface shadow-card transition-transform duration-150 ${
            checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SectionDivider() {
  return <div className="my-5 border-t border-soil-100" />;
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>
      <Card><Skeleton className="h-40 w-full" /></Card>
      <Card><Skeleton className="h-40 w-full" /></Card>
      <Card><Skeleton className="h-40 w-full" /></Card>
      <Card><Skeleton className="h-24 w-full" /></Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Initials helper                                                    */
/* ------------------------------------------------------------------ */

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

/** Settings (`/settings`) — farmer profile & preferences via backend API. */
export function SettingsPage() {
  const { t, lang, setLang } = useT();
  const location = useLocation();
  const { district: appDistrict, setDistrict: setAppDistrict } = useAppSettings();
  const { theme, setTheme } = useTheme();
  const { user, status: loadStatus, error: loadError, save: patchUser, retry: retryLoad } = useUserProfile();

  /* -- Local form state (initialized from defaults, then hydrated from backend) -- */
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [prefs, setPrefs] = useState(() => ({ ...PREF_DEFAULTS }));
  const [formDistrict, setFormDistrict] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState('success');
  const [saving, setSaving] = useState(false);

  /* -- Hydrate local state when backend user arrives -- */
  useEffect(() => {
    if (!user) return;
    setProfileName(user.name ?? '');
    setProfileEmail(user.email ?? '');
    setFormDistrict(user.district ?? '');
    if (user.preferences && typeof user.preferences === 'object') {
      setPrefs((prev) => ({ ...PREF_DEFAULTS, ...fromBackendPrefs(user.preferences) }));
    }
  }, [user]);

  /* -- Scroll to hash anchor -- */
  useEffect(() => {
    const targetId = location.hash.slice(1);
    if (!targetId) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  /* -- Updaters -- */
  const updatePref = useCallback((key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setFeedback('');
  }, []);

  /* -- Build the PATCH payload from current form state -- */
  const buildPayload = useCallback(() => ({
    name: profileName || null,
    email: profileEmail || null,
    language: lang,
    district: formDistrict || null,
    preferences: toBackendPrefs(prefs),
  }), [profileName, profileEmail, lang, formDistrict, prefs]);

  /* -- Save handler (profile editor + bottom bar) -- */
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setFeedback('');
    try {
      await patchUser(buildPayload());
      if (formDistrict) setAppDistrict(formDistrict);
      setEditingProfile(false);
      setFeedbackTone('success');
      setFeedback('Your settings have been saved.');
    } catch {
      setFeedbackTone('danger');
      setFeedback('Could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving, patchUser, buildPayload, formDistrict, setAppDistrict]);

  /* -- Reset handler -- */
  const handleReset = useCallback(() => {
    setProfileName('');
    setProfileEmail('');
    setPrefs({ ...PREF_DEFAULTS });
    setFormDistrict('');
    setEditingProfile(false);
    setFeedback('');
  }, []);

  /* -- Language change: apply instantly, sync to backend on next save -- */
  const handleLangChange = useCallback(
    (newLang) => {
      setLang(newLang);
    },
    [setLang],
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {/* -- Loading state -- */}
      {loadStatus === 'loading' && (
        <>
          <SettingsSkeleton />
          <div className="sr-only" aria-live="polite">Loading your settings</div>
        </>
      )}

      {/* -- Error state -- */}
      {loadStatus === 'error' && (
        <ErrorState
          title="Could not load your settings"
          message={loadError?.message || 'Please check your connection and try again.'}
          onRetry={retryLoad}
          retryLabel="Retry"
        />
      )}

      {/* -- Loaded: show the form -- */}
      {loadStatus === 'success' && (
        <>
          {feedback && <Banner tone={feedbackTone}>{feedback}</Banner>}

          <div className="grid gap-6 xl:grid-cols-2">
            {/* ---- Profile ---- */}
            <SettingsSection
              id="profile"
              icon={UserIcon}
              iconTone="field"
              title="Profile"
              description="Keep your farmer profile details up to date."
              className="xl:col-span-2"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-field-100 font-display text-xl font-semibold text-field-800 dark:bg-field-900/20 dark:text-field-400">
                    {getInitials(profileName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-soil-900">
                      {profileName || 'Farmer'}
                    </p>
                    <p className="truncate text-sm text-soil-600">
                      {profileEmail || 'No email set'}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setEditingProfile((c) => !c)}
                >
                  {editingProfile ? 'Close editor' : 'Edit profile'}
                </Button>
              </div>

              {editingProfile && (
                <div className="mt-5 grid gap-4 border-t border-soil-100 pt-5 sm:grid-cols-2">
                  <TextField
                    label="Name"
                    value={profileName}
                    onChange={(e) => { setProfileName(e.target.value); setFeedback(''); }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => { setProfileEmail(e.target.value); setFeedback(''); }}
                  />
                  <div className="sm:col-span-2 flex flex-wrap gap-3">
                    <Button type="button" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save profile'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingProfile(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </SettingsSection>

            {/* ---- Language & preferences ---- */}
            <SettingsSection
              icon={GlobeIcon}
              iconTone="sky"
              title="Language & preferences"
              description="Choose how Agri Copilot presents language, units, and dates."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Language"
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value)}
                  options={LANGUAGE_OPTIONS}
                />
                <SelectField
                  label="District"
                  value={formDistrict}
                  onChange={(e) => { setFormDistrict(e.target.value); setFeedback(''); }}
                  options={[{ value: '', label: 'Select a district' }, ...DISTRICT_OPTIONS]}
                />
                <SelectField
                  label="Temperature unit"
                  value={prefs.temperatureUnit}
                  onChange={(e) => updatePref('temperatureUnit', e.target.value)}
                  options={TEMPERATURE_OPTIONS}
                />
                <SelectField
                  label="Date format"
                  value={prefs.dateFormat}
                  onChange={(e) => updatePref('dateFormat', e.target.value)}
                  options={DATE_OPTIONS}
                />
              </div>
            </SettingsSection>

            {/* ---- Weather settings ---- */}
            <SettingsSection
              icon={CloudRainIcon}
              iconTone="sky"
              title="Weather settings"
              description="Set the place and alerts used for your daily weather view."
            >
              <TextField
                label="Default location"
                value={prefs.defaultLocation}
                onChange={(e) => updatePref('defaultLocation', e.target.value)}
              />
              <SectionDivider />
              <div>
                <p className="mb-3 text-sm font-semibold text-soil-800">Weather notifications</p>
                <div>
                  <ToggleRow
                    label="Weather alerts"
                    description="Get useful changes in local conditions."
                    checked={prefs.weatherAlerts}
                    onChange={(v) => updatePref('weatherAlerts', v)}
                  />
                  <ToggleRow
                    label="Daily summary"
                    description="See a short forecast at the start of each day."
                    checked={prefs.dailySummary}
                    onChange={(v) => updatePref('dailySummary', v)}
                  />
                  <ToggleRow
                    label="Severe alerts"
                    description="Prioritize high-impact weather warnings."
                    checked={prefs.severeAlerts}
                    onChange={(v) => updatePref('severeAlerts', v)}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* ---- Farming preferences ---- */}
            <SettingsSection
              icon={SproutIcon}
              iconTone="field"
              title="Farming preferences"
              description="Help tailor crop guidance and reminders to your farm."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Crop type"
                  value={prefs.cropType}
                  onChange={(e) => updatePref('cropType', e.target.value)}
                  options={CROP_OPTIONS}
                />
                <TextField
                  label="Farm location"
                  value={prefs.farmLocation}
                  onChange={(e) => updatePref('farmLocation', e.target.value)}
                />
              </div>
              <SectionDivider />
              <ToggleRow
                label="Irrigation reminder"
                description="Receive a local reminder to check watering needs."
                checked={prefs.irrigationReminder}
                onChange={(v) => updatePref('irrigationReminder', v)}
              />
              <ToggleRow
                label="Personalized recommendations"
                description="Use these preferences to shape farming suggestions."
                checked={prefs.recommendations}
                onChange={(v) => updatePref('recommendations', v)}
              />
            </SettingsSection>

            {/* ---- Appearance (LOCAL only) ---- */}
            <SettingsSection
              icon={SettingsIcon}
              iconTone="neutral"
              title="Appearance"
              description="Choose a display preference for this device."
            >
              <SelectField
                label="Theme preference"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                options={THEME_OPTIONS}
              />
              <p className="mt-3 text-xs leading-relaxed text-soil-500">
                The theme is applied instantly and saved locally for this device.
              </p>
            </SettingsSection>

            {/* ---- Notifications ---- */}
            <SettingsSection
              icon={DropletIcon}
              iconTone="sky"
              title="Notifications"
              description="Control the farming updates you want to see."
            >
              <ToggleRow
                label="Weather alerts"
                description="Show weather-related updates in your notification feed."
                checked={prefs.notificationWeatherAlerts}
                onChange={(v) => updatePref('notificationWeatherAlerts', v)}
              />
              <ToggleRow
                label="Farming recommendations"
                description="Show timely crop and field suggestions."
                checked={prefs.farmingRecommendations}
                onChange={(v) => updatePref('farmingRecommendations', v)}
              />
            </SettingsSection>

            {/* ---- Privacy & data ---- */}
            <SettingsSection
              icon={InfoIcon}
              iconTone="neutral"
              title="Privacy & data"
              description="Manage the preferences saved in your profile."
            >
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-soil-800">Reset preferences</p>
                  <p className="mt-1 text-xs leading-relaxed text-soil-500">
                    Reset this page's profile and preferences to their defaults.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  className="w-full sm:w-fit"
                  onClick={handleReset}
                >
                  Reset to defaults
                </Button>
                <div className="border-t border-soil-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-soil-800">Export data</p>
                    <Badge tone="neutral">Coming soon</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-soil-500">
                    A downloadable copy of your data will be available here later.
                  </p>
                  <Button type="button" variant="outline" className="mt-3" disabled>
                    Export data
                  </Button>
                </div>
              </div>
            </SettingsSection>

            {/* ---- About ---- */}
            <SettingsSection
              icon={CalendarIcon}
              iconTone="neutral"
              title="About"
              description="App information and helpful legal links."
            >
              <dl className="divide-y divide-soil-100 text-sm">
                <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <dt className="text-soil-600">App name</dt>
                  <dd className="font-medium text-soil-900">Agri Copilot</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-soil-600">Version</dt>
                  <dd className="font-medium text-soil-900">1.0.0</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a
                  href="#terms-of-service"
                  onClick={(e) => e.preventDefault()}
                  className="font-medium text-field-700 underline decoration-field-300 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600"
                >
                  Terms of Service
                </a>
                <a
                  href="#privacy-policy"
                  onClick={(e) => e.preventDefault()}
                  className="font-medium text-field-700 underline decoration-field-300 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600"
                >
                  Privacy Policy
                </a>
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-sun-200 bg-sun-50 p-3 text-sm text-sun-800 dark:border-sun-500/30 dark:bg-sun-900/15 dark:text-sun-400">
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Agri Copilot gives AI guidance. For critical decisions, confirm with your local agriculture officer.</p>
              </div>
            </SettingsSection>
          </div>

          {/* ---- Bottom save bar ---- */}
          <div className="flex flex-col gap-3 rounded-xl border border-field-200 bg-field-50 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between md:p-5 dark:border-field-500/30 dark:bg-field-900/15">
            <div>
              <p className="text-sm font-semibold text-field-900 dark:text-field-400">Ready to keep these preferences?</p>
              <p className="mt-1 text-sm text-field-800 dark:text-field-300">Your profile and preferences are saved to your account.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset to defaults
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="sr-only" aria-live="polite">
        {feedback}
      </div>
    </div>
  );
}

export default SettingsPage;
