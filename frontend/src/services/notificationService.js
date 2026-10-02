import {
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from './api';

/** Backend NotificationRead → frontend shape (camelCase). */
const normalizeNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  read: notification.read,
  deepLink: notification.deep_link ?? null,
  createdAt: notification.created_at,
});

export function getNotifications() {
  return fetchNotifications().then((items) => items.map(normalizeNotification));
}

export function markNotificationRead(id) {
  return markNotificationReadRequest(id).then(normalizeNotification);
}

export function markAllNotificationsRead() {
  return markAllNotificationsReadRequest().then((data) => data?.updated ?? 0);
}
