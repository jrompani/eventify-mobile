import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { API_BASE_URL } from '../config/env';
import { AuthSession } from '../types/auth';

export type NotificationType =
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'ENTITLEMENT_ISSUED'
  | 'ENTITLEMENT_REVOKED'
  | 'STAFF_ADDED'
  | 'CHECK_IN_CREATED'
  | 'WAITLIST_OFFERED'
  | 'ORGANIZER_EVENT_CREATED'
  | 'REGISTRATION_CREATED';

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

export type NotificationRealtimeEvent =
  | {
      name: 'notification.created';
      data: {
        notificationId: string;
        type: NotificationType;
        unreadCount: number;
      };
    }
  | {
      name: 'notification.unread-count';
      data: {
        unreadCount: number;
      };
    };

type NotificationStreamHandlers = {
  onEvent: (event: NotificationRealtimeEvent) => void;
  onError?: (error: Error) => void;
};

export function subscribeToNotificationStream(
  session: AuthSession,
  handlers: NotificationStreamHandlers
): () => void {
  const controller = new AbortController();
  let stopped = false;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  async function connect() {
    try {
      const response = await fetch(`${API_BASE_URL}/me/notifications/stream`, {
        method: 'GET',
        headers: notificationStreamHeaders(session),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`Notification stream failed with status ${response.status}`);
        if (response.status === 401 || response.status === 403) {
          handlers.onError?.(error);
          return;
        }
        throw error;
      }

      if (!response.body || typeof response.body.getReader !== 'function') {
        handlers.onError?.(new Error('Notification stream is not supported by this runtime.'));
        return;
      }

      await readEventStream(response.body.getReader(), handlers.onEvent, controller.signal);
    } catch (exception) {
      if (stopped || controller.signal.aborted) {
        return;
      }
      handlers.onError?.(exception instanceof Error ? exception : new Error('Notification stream failed.'));
    }

    if (!stopped && !controller.signal.aborted) {
      retryTimeout = setTimeout(connect, 3000);
    }
  }

  void connect();

  return () => {
    stopped = true;
    controller.abort();
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  };
}

async function readEventStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: NotificationRealtimeEvent) => void,
  signal: AbortSignal
) {
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const normalized = buffer.replace(/\r\n/g, '\n');
    const chunks = normalized.split('\n\n');
    buffer = chunks.pop() ?? '';

    chunks.forEach((chunk) => {
      const event = parseServerSentEvent(chunk);
      if (event) {
        onEvent(event);
      }
    });
  }
}

function parseServerSentEvent(raw: string): NotificationRealtimeEvent | null {
  let name = '';
  const dataLines: string[] = [];

  raw.split('\n').forEach((line) => {
    if (line.startsWith('event:')) {
      name = line.slice('event:'.length).trim();
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  });

  if (name !== 'notification.created' && name !== 'notification.unread-count') {
    return null;
  }

  try {
    return {
      name,
      data: JSON.parse(dataLines.join('\n')),
    } as NotificationRealtimeEvent;
  } catch {
    return null;
  }
}

function notificationStreamHeaders(session: AuthSession) {
  const headers = new Headers();
  headers.set('Accept', 'text/event-stream');

  if (session.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    return headers;
  }

  if (session.password) {
    headers.set('Authorization', `Basic ${encodeBase64(`${session.email}:${session.password}`)}`);
  }

  return headers;
}

function encodeBase64(value: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const bytes = unescape(encodeURIComponent(value));
  let output = '';
  let index = 0;

  while (index < bytes.length) {
    const chr1 = bytes.charCodeAt(index++);
    const chr2 = bytes.charCodeAt(index++);
    const chr3 = bytes.charCodeAt(index++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
}
