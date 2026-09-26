import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useTheme } from '../theme/useTheme';
import { LANGUAGES } from '../i18n/I18nProvider';
import { useAppSettings } from '../settings/useAppSettings';
import { usePageTitle } from '../hooks/usePageTitle';
import { DISTRICTS, districtName } from '../lib/districts';
import { BrandMark } from '../components/layout/BrandMark';
import { OnboardingBackdrop } from '../components/layout/OnboardingBackdrop';
import { Button } from '../components/ui/Button';
import { SelectField } from '../components/ui/SelectField';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { MoonIcon } from '../components/ui/icons/MoonIcon';
import { SunIcon } from '../components/ui/icons/SunIcon';
import { cn } from '../lib/cn';

const STEP_HEADING_KEYS = ['welcome.stepLanguage', 'welcome.stepValue', 'welcome.stepDistrict'];

const VALUE_ROWS = [
  { icon: ChatIcon, titleKey: 'welcome.valueAssistant', descKey: 'welcome.valueAssistantDesc' },
  { icon: LeafIcon, titleKey: 'welcome.valueScan', descKey: 'welcome.valueScanDesc' },
  { icon: CloudRainIcon, titleKey: 'welcome.valueWeather', descKey: 'welcome.valueWeatherDesc' },
];

/*
 * NOTE ON DARK-MODE COLOURS: the `.dark` block in index.css INVERTS the whole
 * `field` green scale (field-50 becomes near-black, field-950 near-white), so
 * light-on-dark text must NOT use `field-50/100`. Every "light green text" and
 * deep-green surface below is a literal hex — the same safe approach the
 * finalized Login page uses.
 */

/**
 * Welcome / onboarding (frontend-spec.md §5.1): a three-step first-run flow —
 * language (applies instantly, Urdu flips RTL), value rows, then district.
 * Visual language continues from the finalized Login page: full-bleed
 * agricultural scene + a floating glass sheet. Static data only; finishing
 * persists `agri.district` + `agri.onboarded` (`agri.lang` is already persisted
 * by I18nProvider) and routes to the app. All behaviour is unchanged from the
 * original — only the presentation evolved.
 */
export function WelcomePage() {
  const { t, lang, setLang } = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const { completeOnboarding } = useAppSettings();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [district, setDistrict] = useState('');
  const headingRef = useRef(null);
  const firstRenderRef = useRef(true);

  usePageTitle(t('welcome.title'));

  const isDark = resolvedTheme === 'dark';

  // Announce step changes to assistive tech by moving focus to the heading.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex]);

  const finish = () => {
    completeOnboarding(district);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-page px-4 py-10 sm:py-14">
      {/* One continuous agricultural scene behind the whole flow. */}
      <OnboardingBackdrop />

      {/* Theme control — mirrors the Login page, drives the real ThemeProvider. */}
      <ThemeToggle isDark={isDark} onToggle={() => setTheme(isDark ? 'light' : 'dark')} />

      <main className="relative z-10 w-full max-w-lg sm:max-w-xl">
        <div className="rounded-3xl border border-soil-200/80 bg-white/85 p-6 shadow-raised ring-1 ring-black/5 backdrop-blur-xl sm:p-9 dark:border-white/10 dark:bg-[#0a1410]/85 dark:shadow-[0_0_70px_-18px_rgba(34,197,94,0.45)] dark:ring-white/5">
          {/* Brand lockup — consistent across all three steps. */}
          <header className="flex flex-col items-center text-center">
            <BrandMark size="lg" className="ring-1 ring-black/5 dark:ring-white/15" />
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-field-950 sm:text-3xl dark:text-white">
              {t('common.brandName')}
            </h1>
            <p className="mt-1.5 max-w-xs text-sm text-field-800 sm:text-base dark:text-[#bbf7d0]/75">
              {t('welcome.subtitle')}
            </p>
          </header>

          {/* Step progress dots (decorative — the step heading announces state). */}
          <div className="mb-8 mt-7 flex items-center justify-center gap-2" aria-hidden="true">
            {STEP_HEADING_KEYS.map((key, index) => (
              <span
                key={key}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  index === stepIndex
                    ? 'w-7 bg-field-600 dark:bg-[#4ade80]'
                    : 'w-2 bg-soil-300 dark:bg-white/20',
                )}
              />
            ))}
          </div>

          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mb-6 text-center font-display text-xl font-semibold tracking-tight text-field-950 focus:outline-none sm:text-2xl dark:text-white"
          >
            {t(STEP_HEADING_KEYS[stepIndex])}
          </h2>

          {/* Step 1 — language cards */}
          {stepIndex === 0 && (
            <div role="radiogroup" aria-label={t('welcome.stepLanguage')} className="space-y-3">
              {LANGUAGES.map((language) => {
                const selected = lang === language.code;
                return (
                  <label
                    key={language.code}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-colors duration-150',
                      'has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-field-600 has-[:focus-visible]:ring-offset-2 dark:has-[:focus-visible]:ring-[#4ade80]',
                      selected
                        ? 'border-field-600 bg-field-50 dark:border-[#4ade80]/50 dark:bg-[#4ade80]/10 dark:shadow-[0_0_24px_-8px_rgba(74,222,128,0.6)]'
                        : 'border-soil-300 bg-white/60 hover:border-field-300 dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-white/25',
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="text-lg font-semibold text-field-950 dark:text-[#eafaf0]">
                        {language.label}
                      </span>
                      {language.code === 'ur' && (
                        <span className="text-sm text-field-800 dark:text-[#bbf7d0]/70">Urdu</span>
                      )}
                    </span>
                    <input
                      type="radio"
                      name="welcome-language"
                      value={language.code}
                      checked={selected}
                      onChange={() => setLang(language.code)}
                      className="sr-only"
                    />
                    {selected ? (
                      <CheckCircleIcon className="h-6 w-6 shrink-0 text-field-600 dark:text-[#4ade80]" />
                    ) : (
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border-2 border-soil-300 dark:border-white/25"
                        aria-hidden="true"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* Step 2 — value rows */}
          {stepIndex === 1 && (
            <ul className="space-y-3">
              {VALUE_ROWS.map((row) => (
                <li
                  key={row.titleKey}
                  className="flex items-start gap-4 rounded-2xl border border-field-900/10 bg-white/60 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-field-100 text-field-700 dark:bg-[#4ade80]/15 dark:text-[#4ade80]">
                    <row.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-field-950 dark:text-[#eafaf0]">
                      {t(row.titleKey)}
                    </span>
                    <span className="mt-0.5 block text-sm text-field-900/80 dark:text-[#bbf7d0]/75">
                      {t(row.descKey)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Step 3 — district */}
          {stepIndex === 2 && (
            <div>
              <div className="mb-4 flex items-center justify-center gap-2 text-field-700 dark:text-[#4ade80]">
                <MapPinIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{t('welcome.districtHint')}</span>
              </div>
              <SelectField
                label={t('welcome.districtLabel')}
                required
                pill
                placeholder={t('welcome.districtPlaceholder')}
                options={DISTRICTS.map((entry) => ({
                  value: entry.id,
                  label: districtName(entry, lang),
                }))}
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                inputClassName="dark:bg-[#0e1a14] dark:text-[#eafaf0] dark:border-white/10"
              />
            </div>
          )}

          {/* Step navigation — full-width on every size (spec §5.1). */}
          <div className="mt-9 flex flex-col gap-3">
            {stepIndex > 0 && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => setStepIndex(stepIndex - 1)}
                className="h-12 rounded-full border-field-900/15 bg-white/60 text-base font-medium text-field-900 backdrop-blur-sm hover:bg-white/80 dark:border-white/15 dark:bg-white/[0.06] dark:text-[#eafaf0] dark:hover:bg-white/[0.1]"
              >
                {t('welcome.back')}
              </Button>
            )}
            {stepIndex < STEP_HEADING_KEYS.length - 1 ? (
              <Button
                fullWidth
                onClick={() => setStepIndex(stepIndex + 1)}
                className="h-12 rounded-full bg-gradient-to-r from-field-800 to-field-700 text-base font-semibold text-white shadow-raised transition hover:from-field-900 hover:to-field-800 dark:from-[#166534] dark:to-[#15803d] dark:hover:from-[#14532d] dark:hover:to-[#166534]"
              >
                {t('welcome.next')}
              </Button>
            ) : (
              <Button
                fullWidth
                disabled={!district}
                onClick={finish}
                className="h-12 rounded-full bg-gradient-to-r from-field-800 to-field-700 text-base font-semibold text-white shadow-raised transition hover:from-field-900 hover:to-field-800 disabled:opacity-60 dark:from-[#166534] dark:to-[#15803d] dark:hover:from-[#14532d] dark:hover:to-[#166534]"
              >
                {t('welcome.start')}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Light/Dark switch for onboarding — identical treatment to the Login page.
 * Drives the real ThemeProvider (never local state), sits top-right as a
 * compact pill, and works on all three steps.
 */
function ThemeToggle({ isDark, onToggle }) {
  const base =
    'flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500 ';
  const inactive = 'text-field-800/60 hover:text-field-800 dark:text-white/55 dark:hover:text-white ';

  return (
    <div className="absolute end-4 top-4 z-20 sm:end-6 sm:top-6">
      <div className="flex items-center gap-1 rounded-full border border-field-900/10 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={!isDark}
          aria-label="Switch to light theme"
          className={base + (!isDark ? 'bg-field-600 text-white ' : inactive)}
        >
          <SunIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isDark}
          aria-label="Switch to dark theme"
          className={base + (isDark ? 'bg-[#15803d] text-white ' : inactive)}
        >
          <MoonIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
