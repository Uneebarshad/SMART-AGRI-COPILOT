import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  loginApi,
  logoutApi,
  registerApi,
  setStoredToken,
  updateCurrentUser,
} from '../services/api';
import { useAppSettings } from '../settings/useAppSettings';
import { DISTRICTS } from '../lib/districts';

const AuthContext = createContext(null);

/**
 * Authentication provider — owns the access token, the current user, and the
 * login/register/logout lifecycle.  All authenticated API calls go through
 * the shared `request()` wrapper in api.js, which reads the token from
 * localStorage, so we only need to keep it in sync here.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [status, setStatus] = useState(() => (getStoredToken() ? 'loading' : 'idle'));
  // Outcome of pushing the onboarding district to the backend profile:
  // 'idle' | 'syncing' | 'synced' | 'error' | 'invalid'.  Exposed so the UI
  // can surface a failure instead of pretending synchronization happened.
  const [districtSyncStatus, setDistrictSyncStatus] = useState('idle');
  const { district: localDistrict } = useAppSettings();

  // On mount, if a token exists, fetch the current user to restore state.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    fetchCurrentUser()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setStatus('authenticated');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // Token is invalid or expired — clear it.
          if (err?.status === 401) {
            clearStoredToken();
            setToken(null);
          }
          setUser(null);
          setStatus('idle');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Onboarding district synchronization.  /welcome runs before an account
  // exists, so the selected district can only reach localStorage at that
  // point.  Once authentication is established (login, register, or a
  // restored session) we push it to the backend profile so the dashboard
  // fetches weather for the farmer's real district instead of the server
  // default.  The backend stays the source of truth: we only write when the
  // profile has no district yet and never overwrite a saved one — Settings
  // updates continue through the same PATCH /users/me endpoint.
  useEffect(() => {
    if (status !== 'authenticated' || !user || user.district || !localDistrict) {
      return;
    }
    // Validate against the shared district registry before spending a
    // request; a tampered localStorage value must not be pushed.
    if (!DISTRICTS.some((entry) => entry.id === localDistrict)) {
      setDistrictSyncStatus('invalid');
      return;
    }
    let cancelled = false;
    setDistrictSyncStatus('syncing');
    updateCurrentUser({ district: localDistrict })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setDistrictSyncStatus('synced');
        }
      })
      .catch(() => {
        // Honest failure: the profile keeps no district and the status
        // reflects it; the sync is retried on the next authenticated load.
        if (!cancelled) setDistrictSyncStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [status, user, localDistrict]);

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    setStoredToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setStatus('authenticated');
    return data;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const data = await registerApi({ name, email, password });
    setStoredToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setStatus('authenticated');
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Logout is best-effort on the server; we always clear local state.
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStatus('idle');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      districtSyncStatus,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      register,
      logout,
    }),
    [user, token, status, districtSyncStatus, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export { AuthContext };
