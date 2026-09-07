import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { LANGUAGES } from '../i18n/I18nProvider';
import { useAppSettings } from '../settings/useAppSettings';
import { usePageTitle } from '../hooks/usePageTitle';
import { DISTRICTS, districtName } from '../lib/districts';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SelectField } from '../components/ui/SelectField';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { cn } from '../lib/cn';

const STEP_HEADING_KEYS = ['welcome.stepLanguage', 'welcome.stepValue', 'welcome.stepDistrict'];

const VALUE_ROWS = [
  { icon: ChatIcon, titleKey: 'welcome.valueAssistant', descKey: 'welcome.valueAssistantDesc' },
  { icon: LeafIcon, titleKey: 'welcome.valueScan', descKey: 'welcome.valueScanDesc' },
  { icon: CloudRainIcon, titleKey: 'welcome.valueWeather', descKey: 'welcome.valueWeatherDesc' },
];

/**
 * Welcome / onboarding (frontend-spec.md §5.1): a three-step first-run flow —
 * language (applies instantly, Urdu flips RTL), value rows, then district.
 * Static data only; finishing persists `agri.district` + `agri.onboarded`
 * (`agri.lang` is already persisted by I18nProvider) and routes to the app.
 */
export function WelcomePage() {
  const { t, lang, setLang } = useT();
  const { completeOnboarding } = useAppSettings();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [district, setDistrict] = useState('');
  const headingRef = useRef(null);
  const firstRenderRef = useRef(true);

  usePageTitle(t('welcome.title'));

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
    <div className="flex min-h-dvh flex-col bg-page">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8 sm:py-12">
        {/* Brand hero */}
        <header className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-soil-900 sm:text-3xl">
            {t('common.brandName')}
          </h1>
          <p className="mt-1.5 max-w-xs text-sm text-soil-600 sm:text-base">{t('welcome.subtitle')}</p>
        </header>

        {/* Step progress dots (decorative — the step heading announces state) */}
        <div className="mb-8 flex items-center justify-center gap-2" aria-hidden="true">
          {STEP_HEADING_KEYS.map((key, index) => (
            <span
              key={key}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                index === stepIndex ? 'w-7 bg-field-600' : 'w-2 bg-soil-300',
              )}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mb-5 text-center font-display text-lg font-semibold tracking-tight text-soil-900 focus:outline-none sm:text-xl"
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
                      'flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl border bg-surface p-4 shadow-card transition-colors duration-150',
                      'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-field-600 has-[:focus-visible]:ring-offset-2',
                      selected ? 'border-field-600 bg-field-50 dark:border-field-500 dark:bg-field-900/15' : 'border-soil-300 dark:border-soil-200 hover:border-field-300',
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="text-lg font-semibold text-soil-900">{language.label}</span>
                      {language.code === 'ur' && <span className="text-sm text-soil-500">Urdu</span>}
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
                      <CheckCircleIcon className="h-6 w-6 shrink-0 text-field-600" />
                    ) : (
                      <span className="h-6 w-6 shrink-0 rounded-full border-2 border-soil-300" aria-hidden="true" />
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
                <li key={row.titleKey}>
                  <Card className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400">
                      <row.icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-semibold text-soil-900">{t(row.titleKey)}</span>
                      <span className="mt-0.5 block text-sm text-soil-600">{t(row.descKey)}</span>
                    </span>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {/* Step 3 — district */}
          {stepIndex === 2 && (
            <SelectField
              label={t('welcome.districtLabel')}
              required
              hint={t('welcome.districtHint')}
              placeholder={t('welcome.districtPlaceholder')}
              options={DISTRICTS.map((entry) => ({
                value: entry.id,
                label: districtName(entry, lang),
              }))}
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            />
          )}

          {/* Step navigation — full-width on every size (spec §5.1) */}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            {stepIndex > 0 && (
              <Button variant="outline" fullWidth onClick={() => setStepIndex(stepIndex - 1)}>
                {t('welcome.back')}
              </Button>
            )}
            {stepIndex < STEP_HEADING_KEYS.length - 1 ? (
              <Button fullWidth onClick={() => setStepIndex(stepIndex + 1)}>
                {t('welcome.next')}
              </Button>
            ) : (
              <Button fullWidth disabled={!district} onClick={finish}>
                {t('welcome.start')}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default WelcomePage;
