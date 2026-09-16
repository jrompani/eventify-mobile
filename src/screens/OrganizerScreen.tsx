import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  approveOrganizerRequest,
  checkInByEntitlementCode,
  getOrganizerDashboard,
  OrganizerDashboard,
  OrganizerEventSummary,
  rejectOrganizerRequest,
  listOrganizerEvents,
} from '../api/organizer';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';

type OrganizerScreenProps = {
  session: AuthSession;
};

export function OrganizerScreen({ session }: OrganizerScreenProps) {
  const [events, setEvents] = useState<OrganizerEventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      void loadDashboard(selectedEventId);
    }
  }, [selectedEventId]);

  async function loadEvents() {
    setLoadingEvents(true);
    setError(null);
    setMessage(null);
    try {
      const page = await listOrganizerEvents(session);
      setEvents(page.content);
      setSelectedEventId((current) => current ?? page.content[0]?.id ?? null);
      if (page.content.length === 0) {
        setDashboard(null);
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar Organizer');
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadDashboard(experienceId: string) {
    setLoadingDashboard(true);
    setError(null);
    try {
      const nextDashboard = await getOrganizerDashboard(session, experienceId);
      setDashboard(nextDashboard);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function handleRequestAction(requestId: string, action: 'approve' | 'reject') {
    if (!selectedEventId) {
      return;
    }

    setActingRequestId(requestId);
    setError(null);
    setMessage(null);
    try {
      const response = action === 'approve'
        ? await approveOrganizerRequest(session, selectedEventId, requestId)
        : await rejectOrganizerRequest(session, selectedEventId, requestId);
      setMessage(action === 'approve' ? `Solicitud aprobada: ${response.result}` : `Solicitud rechazada: ${response.result}`);
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar la solicitud');
    } finally {
      setActingRequestId(null);
    }
  }

  async function handleCheckIn() {
    const code = checkInCode.trim();
    if (!selectedEventId || !code) {
      return;
    }

    setCheckingIn(true);
    setError(null);
    setMessage(null);
    try {
      const response = await checkInByEntitlementCode(session, selectedEventId, code);
      setMessage(`Acceso ${response.status}: ${response.userEmail}`);
      setCheckInCode('');
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo confirmar el acceso');
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Organizer</Text>
          <Text style={styles.screenMeta}>Eventos, solicitudes, equipo y check-in</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={loadEvents} disabled={loadingEvents}>
          <Ionicons name="refresh" size={19} color={colors.primary} />
        </Pressable>
      </View>

      {loadingEvents ? <Text style={styles.metaText}>Cargando eventos...</Text> : null}
      {error ? <RetryMessage message={error} onRetry={selectedEventId ? () => loadDashboard(selectedEventId) : loadEvents} /> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}

      {events.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRail}>
          {events.map((event) => {
            const selected = event.id === selectedEventId;
            return (
              <Pressable
                key={event.id}
                style={[styles.eventChip, selected && styles.eventChipActive]}
                onPress={() => setSelectedEventId(event.id)}
              >
                <Text style={[styles.eventChipTitle, selected && styles.eventChipTitleActive]} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventChipMeta}>{event.status}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : !loadingEvents ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyTitle}>Sin eventos creados</Text>
          <Text style={styles.emptyMeta}>Cuando publiques una experiencia, aparece aca para operarla.</Text>
        </View>
      ) : null}

      {dashboard ? (
        <>
          <View style={styles.summaryGrid}>
            <Metric label="Registrados" value={`${dashboard.summary.registeredCount}`} />
            <Metric label="Pendientes" value={`${dashboard.summary.pendingRequestCount}`} />
            <Metric label="Check-ins" value={`${dashboard.summary.checkedInCount}`} />
            <Metric label="Ventas" value={formatMoney(dashboard.summary.grossSalesAmount, dashboard.summary.grossSalesCurrency)} />
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Check-in manual</Text>
            <TextInput
              value={checkInCode}
              onChangeText={setCheckInCode}
              placeholder="Codigo SafePass"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.primaryButton, (!checkInCode.trim() || checkingIn) && styles.disabled]}
              onPress={handleCheckIn}
              disabled={!checkInCode.trim() || checkingIn}
            >
              <Text style={styles.primaryButtonText}>{checkingIn ? 'Confirmando...' : 'Confirmar acceso'}</Text>
            </Pressable>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Solicitudes pendientes</Text>
            {loadingDashboard ? <Text style={styles.metaText}>Actualizando...</Text> : null}
            {dashboard.pendingRequests.length > 0 ? (
              dashboard.pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestRow}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{request.userEmail}</Text>
                    <Text style={styles.rowMeta}>{request.status}</Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable
                      style={[styles.smallButton, actingRequestId === request.id && styles.disabled]}
                      onPress={() => handleRequestAction(request.id, 'approve')}
                      disabled={actingRequestId === request.id}
                    >
                      <Text style={styles.smallButtonText}>OK</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.rejectButton, actingRequestId === request.id && styles.disabled]}
                      onPress={() => handleRequestAction(request.id, 'reject')}
                      disabled={actingRequestId === request.id}
                    >
                      <Text style={styles.rejectButtonText}>No</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>No hay solicitudes pendientes.</Text>
            )}
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Roster</Text>
            {dashboard.attendees.length > 0 ? (
              dashboard.attendees.map((attendee) => (
                <Text key={attendee.registrationId} style={styles.listLine}>
                  {attendee.userEmail} - {attendee.status}
                </Text>
              ))
            ) : (
              <Text style={styles.metaText}>Sin asistentes confirmados.</Text>
            )}
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Equipo</Text>
            {dashboard.staff.length > 0 ? (
              dashboard.staff.map((staff) => (
                <Text key={staff.id} style={styles.listLine}>
                  {staff.userEmail} - {staff.role}
                </Text>
              ))
            ) : (
              <Text style={styles.metaText}>No hay staff asignado.</Text>
            )}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RetryMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.retryBox}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

function formatMoney(amount: number, currency: string) {
  if (amount <= 0) {
    return '0';
  }
  return `${currency} ${amount}`;
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
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRail: {
    gap: 8,
  },
  eventChip: {
    width: 176,
    minHeight: 62,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 10,
    justifyContent: 'center',
  },
  eventChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  eventChipTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  eventChipTitleActive: {
    color: colors.primary,
  },
  eventChipMeta: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '800',
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    width: '48%',
    minHeight: 70,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  metricValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '800',
    fontSize: 12,
  },
  block: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  blockTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    color: colors.text,
    paddingHorizontal: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  requestRow: {
    minHeight: 62,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  rowMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallButton: {
    minHeight: 36,
    minWidth: 42,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: colors.black,
    fontWeight: '900',
  },
  rejectButton: {
    minHeight: 36,
    minWidth: 42,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.danger,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: colors.danger,
    fontWeight: '900',
  },
  listLine: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 20,
  },
  emptyState: {
    minHeight: 180,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 8,
  },
  emptyMeta: {
    color: colors.muted,
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBox: {
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: colors.black,
    fontWeight: '900',
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
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
  disabled: {
    opacity: 0.55,
  },
});
