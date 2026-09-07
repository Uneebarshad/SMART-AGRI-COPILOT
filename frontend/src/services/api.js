const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const DEFAULT_TIMEOUT_MS = 15000;

// ---------------------------------------------------------------------------
// Token storage — kept in localStorage for the SPA; a mobile client would
// use the same Bearer-token contract without browser storage.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'agri.access_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage unavailable — ignore.
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

/**
 * Base fetch wrapper for API calls (frontend-spec.md §15.1): the single HTTP
 * boundary. Supports JSON and FormData bodies, per-request timeouts, an
 * optional AbortSignal, and parses the §15.2 error envelope
 * (`{ error: { code, message } }`) into thrown errors carrying `status`
 * and `code`. All HTTP requests go through this function, making it easy to
 * add auth headers or swap the HTTP client later.
 */
async function request(endpoint, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, headers: extraHeaders, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', forwardAbort);
    }
  }

  try {
    const isFormData = fetchOptions.body instanceof FormData;
    const token = getStoredToken();
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers,
      ...fetchOptions,
    });

    if (!response.ok) {
      let code = 'internal_error';
      let message = '';
      try {
        const body = await response.json();
        code = body?.error?.code ?? body?.detail?.code ?? code;
        message = body?.error?.message ?? body?.detail?.message ?? '';
      } catch {
        // Non-JSON error body — keep the defaults.
      }
      const error = new Error(message || `API error: ${response.status}`);
      error.status = response.status;
      error.code = code;
      throw error;
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (failure) {
    if (failure?.name === 'AbortError') {
      const error = new Error('Request timed out or was cancelled');
      error.code = 'timeout_or_cancelled';
      throw error;
    }
    throw failure;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', forwardAbort);
  }
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export function loginApi(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function logoutApi() {
  return request('/auth/logout', { method: 'POST' });
}

export function forgotPasswordApi(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordApi(token, newPassword) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Existing endpoints (unchanged signatures)
// ---------------------------------------------------------------------------

export function fetchHealth() {
  return request('/health', { timeoutMs: 5000 });
}

/** Current user profile (backend UserRead). */
export function fetchCurrentUser() {
  return request('/users/me', { timeoutMs: 10000 });
}

/** Partial update of the current user profile (PATCH /api/users/me). */
export function updateCurrentUser(payload) {
  return request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Composite dashboard payload (frontend-spec.md §15.3): one request for all
 * home widgets — weather + advisories, alerts, fields, recent AI activity and
 * recommendations. `lang` localizes text-bearing content.
 */
export function fetchDashboard(lang = 'en') {
  return request(`/dashboard?lang=${encodeURIComponent(lang)}`, { timeoutMs: 15000 });
}

/**
 * Assistant chat (frontend-spec.md §15.4): request/response — no streaming
 * (Appendix A2). Optimistic bubble and pending state live in useConversation.
 * 45 s timeout per §15.2.
 */
export function chatAssistant({ conversationId, message, language }) {
  return request('/assistant/chat', {
    method: 'POST',
    timeoutMs: 45000,
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      language,
    }),
  });
}

/** Conversation CRUD boundary used by conversationService.js. */
export function createConversationRequest(payload = {}) {
  return request('/conversations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchConversations() {
  return request('/conversations', { timeoutMs: 10000 });
}

export function fetchConversation(conversationId) {
  return request(`/conversations/${encodeURIComponent(conversationId)}`, {
    timeoutMs: 10000,
  });
}

export function deleteConversationRequest(conversationId) {
  return request(`/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
  });
}

export function addConversationMessageRequest(conversationId, payload) {
  return request(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchConversationMessages(conversationId) {
  return request(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    timeoutMs: 10000,
  });
}

/**
 * Leaf-scan analysis (frontend-spec.md §15.6): multipart POST — the request
 * wrapper detects FormData and lets the browser set the boundary header.
 * 90 s timeout per §7.3; `signal` powers the in-flight Cancel button.
 */
export function analyzeDiagnosis({ image, crop, notes, language, signal }) {
  const formData = new FormData();
  formData.append('image', image);
  if (crop) formData.append('crop', crop);
  if (notes) formData.append('notes', notes);
  formData.append('language', language);
  return request('/diagnosis/analyze', {
    method: 'POST',
    timeoutMs: 90000,
    signal,
    body: formData,
  });
}

/** Saved scans for the capture screen's "Past scans" list (§7.5). */
export function fetchScans(lang = 'en') {
  return request(`/diagnosis/scans?lang=${encodeURIComponent(lang)}`, { timeoutMs: 10000 });
}

/** One saved scan for /diagnosis/:scanId (§15.6); 404 → "no longer available". */
export function fetchScan(scanId, lang = 'en') {
  return request(
    `/diagnosis/scans/${encodeURIComponent(scanId)}?lang=${encodeURIComponent(lang)}`,
    { timeoutMs: 10000 },
  );
}

/** Field CRUD boundary used by fieldService.js. */
export function fetchFields() {
  return request('/fields', { timeoutMs: 10000 });
}

export function fetchField(fieldId) {
  return request(`/fields/${encodeURIComponent(fieldId)}`, { timeoutMs: 10000 });
}

export function createFieldRequest(payload) {
  return request('/fields', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFieldRequest(fieldId, payload) {
  return request(`/fields/${encodeURIComponent(fieldId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteFieldRequest(fieldId) {
  return request(`/fields/${encodeURIComponent(fieldId)}`, {
    method: 'DELETE',
  });
}

/** Recommendation CRUD boundary used by recommendationService.js. */
export function fetchRecommendations() {
  return request('/recommendations', { timeoutMs: 10000 });
}

export function fetchRecommendation(recommendationId) {
  return request(`/recommendations/${encodeURIComponent(recommendationId)}`, {
    timeoutMs: 10000,
  });
}

export function createRecommendationRequest(payload) {
  return request('/recommendations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRecommendationRequest(recommendationId, payload) {
  return request(`/recommendations/${encodeURIComponent(recommendationId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteRecommendationRequest(recommendationId) {
  return request(`/recommendations/${encodeURIComponent(recommendationId)}`, {
    method: 'DELETE',
  });
}

/** History CRUD boundary used by historyService.js. */
export function fetchHistory() {
  return request('/history', { timeoutMs: 10000 });
}

export function fetchHistoryItem(historyId) {
  return request(`/history/${encodeURIComponent(historyId)}`, { timeoutMs: 10000 });
}

export function deleteHistoryItem(historyId) {
  return request(`/history/${encodeURIComponent(historyId)}`, {
    method: 'DELETE',
  });
}

/** Disease library boundary used by diseaseService.js. */
export function fetchDiseases(params = {}) {
  const query = new URLSearchParams();
  if (params.crop) query.set('crop', params.crop);
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  if (params.severity) query.set('severity', params.severity);
  const qs = query.toString();
  return request(`/diseases${qs ? `?${qs}` : ''}`, { timeoutMs: 10000 });
}

export function fetchDiseaseById(diseaseId) {
  return request(`/diseases/${encodeURIComponent(diseaseId)}`, { timeoutMs: 10000 });
}

/**
 * Weather forecast (frontend-spec.md §15.5): current conditions, hourly and
 * daily forecast, and farming advisories for a Pakistan district.
 * `lang` localizes advisory text; the backend's 10-minute cache applies.
 */
export function fetchWeather(district, lang = 'en') {
  return request(
    `/weather?district=${encodeURIComponent(district)}&lang=${encodeURIComponent(lang)}`,
    { timeoutMs: 15000 },
  );
}
