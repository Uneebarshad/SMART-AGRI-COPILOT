const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Base fetch wrapper for API calls.
 * All HTTP requests go through this function, making it easy to
 * add auth headers, interceptors, or swap the HTTP client later.
 */
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function fetchHealth() {
  return request('/health');
}
