import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  loginApi,
  logoutApi,
  registerApi,
  setStoredToken,
} from '../services/api';

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
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      register,
      logout,
    }),
    [user, token, status, login, register, logout],
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
