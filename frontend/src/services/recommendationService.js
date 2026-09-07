import {
  fetchRecommendation,
  fetchRecommendations,
  updateRecommendationRequest,
} from './api';
import { MOCK_RECOMMENDATIONS } from '../data/recommendationsMock';

const normalizeRecommendation = (recommendation) => ({
  id: `rec-${recommendation.id}`,
  title: recommendation.title,
  category: recommendation.category,
  priority: recommendation.priority,
  status: recommendation.status === 'pending' ? 'active' : recommendation.status,
  description: recommendation.summary ?? '',
  action: recommendation.details ?? '',
  crop: recommendation.crop ?? '',
  field: recommendation.field_name ?? '',
  date: recommendation.recommendation_date ?? recommendation.created_at?.slice(0, 10) ?? '',
  why: recommendation.why ?? '',
  timing: recommendation.timing ?? '',
  notes: recommendation.notes ?? '',
});

const toBackendId = (id) => {
  const match = /^rec-(\d+)$/.exec(String(id));
  return match ? match[1] : id;
};

/** Recommendation service — uses the real FastAPI + PostgreSQL backend. */
const USE_FIXTURE = false;

export function getRecommendations() {
  if (USE_FIXTURE) {
    return Promise.resolve(MOCK_RECOMMENDATIONS);
  }
  return fetchRecommendations().then((recommendations) => recommendations.map(normalizeRecommendation));
}

export function getRecommendation(id) {
  return fetchRecommendation(toBackendId(id)).then(normalizeRecommendation);
}

export function updateRecommendationStatus(id, status) {
  return updateRecommendationRequest(toBackendId(id), { status }).then(normalizeRecommendation);
}
