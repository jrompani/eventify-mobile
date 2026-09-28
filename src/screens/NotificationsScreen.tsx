import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EventifyNotification,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationType,
} from '../api/notifications';
import { acceptWaitlistOffer, declineWaitlistOffer } from '../api/registrations';
import { EmptyState } from '../components/EmptyState';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { formatShortDate } from '../utils/format';

type NotificationsScreenProps = {
  session: AuthSession;
  refreshKey: number;
  onUnreadCountChange: (count: number) => void;
};

export function NotificationsScreen({ session, refreshKey, onUnreadCountChange }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<EventifyNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actingOfferId, setActingOfferId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  useEffect(() => {
    void loadNotifications();
  }, [session, refreshKey]);

  useEffect(() => {
    onUnreadCountChange(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  async function loadNotifications() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const nextNotifications = await listMyNotifications(session);
      setNotifications(nextNotifications);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    setMarkingId(notificationId);
    setError(null);
    try {
      const nextNotification = await markNotificationRead(session, notificationId);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId ? nextNotification : notification
        )
      );
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo marcar como leida');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setError(null);
    try {
      const nextNotifications = await markAllNotificationsRead(session);
      setNotifications(nextNotifications);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron marcar como leidas');
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleAcceptOffer(notification: EventifyNotification) {
    const offer = parseWaitlistOffer(notification);
    if (!offer) {
      setError('La oferta no tiene datos suficientes para aceptarla');
      return;
    }

    setActingOfferId(notification.id);
    setError(null);
    setMessage(null);
    try {
      const response = await acceptWaitlistOffer(session, offer.experienceId);
      const nextNotification = notification.readAt ? notification : await markNotificationRead(session, notification.id);
      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id ? nextNotification : currentNotification
        )
      );
      setMessage(messageForWaitlistResult(response.result));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo aceptar la oferta');
    } finally {
      setActingOfferId(null);
    }
  }

  async function handleDeclineOffer(notification: EventifyNotification) {
    const offer = parseWaitlistOffer(notification);
    if (!offer) {
      setError('La oferta no tiene datos suficientes para rechazarla');
      return;
    }

    setActingOfferId(notification.id);
    setError(null);
    setMessage(null);
    try {
      const response = await declineWaitlistOffer(session, offer.experienceId);
      const nextNotification = notification.readAt ? notification : await markNotificationRead(session, notification.id);
      setNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) =>
          currentNotification.id === notification.id ? nextNotification : currentNotification
        )
      );
      setMessage(messageForWaitlistResult(response.result));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo rechazar la oferta');
    } finally {
      setActingOfferId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Notificaciones</Text>
          <Text style={styles.screenMeta}>{unreadCount} sin leer</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={loadNotifications} disabled={loading}>
          <Ionicons name="refresh" size={19} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <SummaryPill icon="mail-unread-outline" label={`${unreadCount} pendientes`} />
        <SummaryPill icon="notifications-outline" label={`${notifications.length} total`} />
      </View>

      <Pressable
        style={[styles.primaryButton, (unreadCount === 0 || markingAll) && styles.disabled]}
        onPress={handleMarkAllRead}
        disabled={unreadCount === 0 || markingAll}
      >
        <Ionicons name="checkmark-done" size={18} color={colors.black} />
        <Text style={styles.primaryButtonText}>{markingAll ? 'Actualizando...' : 'Marcar todas como leidas'}</Text>
      </Pressable>

      {loading ? <Text style={styles.metaText}>Sincronizando notificaciones...</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {notifications.length > 0 ? (
        notifications.map((notification) => {
          const unread = !notification.readAt;
          const waitlistOffer = parseWaitlistOffer(notification);
          return (
            <View key={notification.id} style={[styles.notificationCard, unread && styles.notificationUnread]}>
              <View style={styles.notificationTop}>
                <View style={[styles.notificationIcon, unread && styles.notificationIconUnread]}>
                  <Ionicons name={iconFor(notification.type)} size={21} color={unread ? colors.primary : colors.muted} />
                </View>
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationBody}>{notification.body}</Text>
                  <Text style={styles.notificationMeta}>
                    {labelFor(notification.type)} - {formatShortDate(notification.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.notificationFooter}>
                <Text style={[styles.statusText, unread && styles.statusUnread]}>
                  {unread ? 'Sin leer' : `Leida ${formatShortDate(notification.readAt)}`}
                </Text>
                {unread ? (
                  <Pressable
                    style={styles.readButton}
                    onPress={() => handleMarkRead(notification.id)}
                    disabled={markingId === notification.id}
                  >
                    <Text style={styles.readButtonText}>{markingId === notification.id ? '...' : 'Marcar'}</Text>
                  </Pressable>
                ) : null}
              </View>

              {waitlistOffer ? (
                <View style={styles.offerBox}>
                  <View style={styles.offerCopy}>
                    <Text style={styles.offerTitle}>Oferta de waitlist</Text>
                    <Text style={styles.offerMeta}>Expira {formatShortDate(waitlistOffer.offerExpiresAt, 'sin fecha')}</Text>
                  </View>
                  <View style={styles.offerActions}>
                    <Pressable
                      style={[styles.acceptButton, actingOfferId === notification.id && styles.disabled]}
                      onPress={() => handleAcceptOffer(notification)}
                      disabled={actingOfferId === notification.id}
                    >
                      <Text style={styles.acceptText}>{actingOfferId === notification.id ? '...' : 'Aceptar'}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.declineButton, actingOfferId === notification.id && styles.disabled]}
                      onPress={() => handleDeclineOffer(notification)}
                      disabled={actingOfferId === notification.id}
                    >
                      <Text style={styles.declineText}>Declinar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      ) : (
        <EmptyState
          icon="notifications-outline"
          title="No tenes notificaciones"
          message="Los cambios de solicitudes, tickets, waitlist y accesos van a aparecer aca."
        />
      )}
    </ScrollView>
  );
}

type WaitlistOfferMetadata = {
  experienceId: string;
  waitlistEntryId?: string;
  offerExpiresAt: string | null;
};

function parseWaitlistOffer(notification: EventifyNotification): WaitlistOfferMetadata | null {
  if (notification.type !== 'WAITLIST_OFFERED' || !notification.metadata) {
    return null;
  }

  try {
    const parsed = JSON.parse(notification.metadata) as Partial<WaitlistOfferMetadata>;
    if (!parsed.experienceId) {
      return null;
    }

    return {
      experienceId: parsed.experienceId,
      waitlistEntryId: parsed.waitlistEntryId,
      offerExpiresAt: parsed.offerExpiresAt ?? null,
    };
  } catch {
    return null;
  }
}

function messageForWaitlistResult(result: string) {
  if (result === 'WAITLIST_ACCEPTED') {
    return 'Oferta aceptada. Tu registro quedo confirmado.';
  }
  if (result === 'WAITLIST_DECLINED') {
    return 'Oferta declinada. El lugar pasa a la siguiente persona.';
  }
  if (result === 'INELIGIBLE') {
    return 'La oferta ya no esta disponible.';
  }
  return `Waitlist actualizado: ${result}.`;
}

function SummaryPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.summaryText}>{label}</Text>
    </View>
  );
}

function iconFor(type: NotificationType): keyof typeof Ionicons.glyphMap {
  if (type === 'REQUEST_APPROVED' || type === 'ENTITLEMENT_ISSUED') {
    return 'checkmark-circle-outline';
  }
  if (type === 'REQUEST_REJECTED' || type === 'ENTITLEMENT_REVOKED') {
    return 'close-circle-outline';
  }
  if (type === 'STAFF_ADDED') {
    return 'briefcase-outline';
  }
  if (type === 'CHECK_IN_CREATED') {
    return 'scan-outline';
  }
  if (type === 'ORGANIZER_EVENT_CREATED') {
    return 'calendar-outline';
  }
  if (type === 'REGISTRATION_CREATED') {
    return 'person-add-outline';
  }
  return 'hourglass-outline';
}

function labelFor(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    REQUEST_APPROVED: 'Solicitud aprobada',
    REQUEST_REJECTED: 'Solicitud rechazada',
    ENTITLEMENT_ISSUED: 'Ticket emitido',
    ENTITLEMENT_REVOKED: 'Ticket revocado',
    STAFF_ADDED: 'Staff',
    CHECK_IN_CREATED: 'Check-in',
    WAITLIST_OFFERED: 'Waitlist',
    ORGANIZER_EVENT_CREATED: 'Organizador',
    REGISTRATION_CREATED: 'Registro',
  };
  return labels[type];
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screenMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '800',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  summaryText: {
    color: colors.primary,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  notificationCard: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12,
  },
  notificationUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  notificationTop: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconUnread: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationBody: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
    lineHeight: 20,
  },
  notificationMeta: {
    color: colors.primary,
    marginTop: 7,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationFooter: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  offerBox: {
    borderRadius: 8,
    borderColor: '#16533F',
    borderWidth: 1,
    backgroundColor: colors.successSoft,
    padding: 10,
    gap: 10,
  },
  offerCopy: {
    gap: 3,
  },
  offerTitle: {
    color: colors.success,
    fontWeight: '900',
  },
  offerMeta: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: colors.black,
    fontWeight: '900',
  },
  declineButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    color: colors.text,
    fontWeight: '900',
  },
  statusText: {
    color: colors.muted,
    fontWeight: '800',
  },
  statusUnread: {
    color: colors.primary,
  },
  readButton: {
    minHeight: 36,
    minWidth: 82,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  readButtonText: {
    color: colors.primary,
    fontWeight: '900',
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
  },
  successText: {
    color: colors.success,
    fontWeight: '800',
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
});
