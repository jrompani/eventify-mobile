import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type NotificationType =
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'ENTITLEMENT_ISSUED'
  | 'ENTITLEMENT_REVOKED'
  | 'STAFF_ADDED'
  | 'CHECK_IN_CREATED'
  | 'WAITLIST_OFFERED';

export type EventifyNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listMyNotifications(session: AuthSession) {
  return apiFetch<EventifyNotification[]>('/me/notifications', {
    ...authOptionsFor(session),
  });
}

export async function markNotificationRead(session: AuthSession, notificationId: string) {
  return apiFetch<EventifyNotification>(`/me/notifications/${notificationId}/read`, {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export async function markAllNotificationsRead(session: AuthSession) {
  return apiFetch<EventifyNotification[]>('/me/notifications/read-all', {
    method: 'POST',
    ...authOptionsFor(session),
  });
}
