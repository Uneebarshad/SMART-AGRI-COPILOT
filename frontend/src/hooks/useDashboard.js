import { useCallback } from 'react';
import { useT } from '../i18n/useT';
import { useApi } from './useApi';
import { fetchDashboard } from '../services/api';
import { pickLocalized } from '../lib/localized';

/**
 * Resolves `*_localized` fields into plain strings for the active language
 * (§15.2). The backend keeps the response language-aware at the contract
 * boundary while this hook provides the UI's plain display fields.
 */
function localizeDashboard(dashboard, lang) {
  const pick = (value) => pickLocalized(value, lang);

  const weather = dashboard.weather && {
    ...dashboard.weather,
    advisories: dashboard.weather.advisories?.map((advisory) => ({
      ...advisory,
      text: pick(advisory.text_localized),
    })),
  };

  const alerts = dashboard.alerts?.map((alert) => ({ ...alert, text: pick(alert.text_localized) }));

  const fields = dashboard.fields?.map((field) => ({ ...field, crop: pick(field.crop_localized) }));

  const recentActivity = dashboard.recent_activity && {
    ...dashboard.recent_activity,
    last_conversation: dashboard.recent_activity.last_conversation && {
      ...dashboard.recent_activity.last_conversation,
      question: pick(dashboard.recent_activity.last_conversation.question_localized),
      answerPreview: pick(dashboard.recent_activity.last_conversation.answer_preview_localized),
    },
    last_scan: dashboard.recent_activity.last_scan && {
      ...dashboard.recent_activity.last_scan,
      disease: pick(dashboard.recent_activity.last_scan.disease_localized),
    },
  };

  const recommendations = dashboard.recommendations?.map((recommendation) => ({
    ...recommendation,
    title: pick(recommendation.title_localized),
    text: pick(recommendation.text_localized),
  }));

  return { ...dashboard, weather, alerts, fields, recent_activity: recentActivity, recommendations };
}

/**
 * Composite dashboard data (§15.3): one request feeding every home widget;
 * widgets degrade independently when their sub-object is absent (§8.2).
 * Refetches on language change because the endpoint is language-aware.
 */
export function useDashboard() {
  const { lang } = useT();
  const fetcher = useCallback(
    () => fetchDashboard(lang).then((payload) => localizeDashboard(payload, lang)),
    [lang],
  );
  return useApi(fetcher);
}
