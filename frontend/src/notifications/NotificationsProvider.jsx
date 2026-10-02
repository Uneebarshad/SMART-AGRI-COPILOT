import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';

const NotificationsContext = createContext(null);

/**
 * Single shared notification inbox (mounted once inside AppShell).
 *
 * One store means one truth: the sidebar badge, the mobile-topbar badge and
 * the full page all read and mutate the same list, so marking read anywhere
 * updates every view immediately. Mark-read actions apply locally only after
 * the backend confirms — the unread count is always the real server-side
 * state, never an estimate or a hardcoded number.
 */
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const applyList = useCallback((items) => {
    if (mountedRef.current) {
      setNotifications(items);
      setStatus('success');
    }
  }, []);

  /* Full refresh: shows the loading state (used for initial load + retry). */
  const refresh = useCallback(() => {
    setStatus('loading');
    return getNotifications()
      .then(applyList)
      .catch(() => {
        if (mountedRef.current) setStatus('error');
      });
  }, [applyList]);

  /* Silent refresh: keeps the current list visible while data revalidates. */
  const refreshSilent = useCallback(() => {
    return getNotifications()
      .then(applyList)
      .catch(() => {
        // Keep showing whatever we have; no error flash on background polls.
      });
  }, [applyList]);

  useEffect(() => {
    refresh();
    /* Gentle freshness: revalidate when the tab regains focus. */
    const handler = () => refreshSilent();
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [refresh, refreshSilent]);

  const markRead = useCallback((id) => {
    return markNotificationRead(id)
      .then((updated) => {
        if (mountedRef.current) {
          setNotifications((current) =>
            current.map((item) => (item.id === id ? { ...item, ...updated, read: true } : item)),
          );
        }
        return updated;
      })
      .catch(() => {
        // Honest failure: the row keeps its unread state; nothing is faked.
      });
  }, []);

  const markAllRead = useCallback(() => {
    return markAllNotificationsRead()
      .then((updated) => {
        if (mountedRef.current && updated > 0) {
          setNotifications((current) => current.map((item) => ({ ...item, read: true })));
        }
        return updated;
      })
      .catch(() => undefined);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({ notifications, status, unreadCount, refresh, refreshSilent, markRead, markAllRead }),
    [notifications, status, unreadCount, refresh, refreshSilent, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsStore() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsStore must be used inside <NotificationsProvider>');
  }
  return ctx;
}
