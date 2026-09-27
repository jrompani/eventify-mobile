import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { listMyTickets, WalletTicketResponse } from '../api/registrations';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { experiences as fallbackExperiences } from '../data/mockExperiences';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';
import { isUuid } from '../utils/format';
import { labelForStatus } from '../utils/statusLabels';

type WalletScreenProps = {
  session: AuthSession;
  experiences: Experience[];
  onOpenExperience: (experience: Experience) => void;
};

type WalletTicket = {
  experience: Experience;
  ticket: WalletTicketResponse;
};

export function WalletScreen({ session, experiences, onOpenExperience }: WalletScreenProps) {
  const [tickets, setTickets] = useState<WalletTicket[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoTickets = useMemo(() => buildDemoTickets(experiences), [experiences]);
  const visibleTickets = tickets.length > 0 ? tickets : !loaded && error ? demoTickets : [];

  useEffect(() => {
    void loadTickets();
  }, [experiences, session]);

  async function loadTickets() {
    setError(null);

    setLoading(true);
    try {
      const nextTickets = await listMyTickets(session);
      setTickets(nextTickets.map((ticket, index) => ({
        ticket,
        experience: toExperience(ticket, experiences, index),
      })));
      setLoaded(true);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar la wallet');
      setLoaded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Wallet</Text>
          <Text style={styles.screenMeta}>SafePass, entradas y accesos activos</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={loadTickets} disabled={loading}>
          <Ionicons name="refresh" size={19} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <SummaryItem label="Activos" value={`${visibleTickets.length}`} />
        <SummaryItem label="Usados" value={`${visibleTickets.filter(({ ticket }) => ticket.usedAt || ticket.entitlementStatus === 'USED').length}`} />
        <SummaryItem label="Pendientes" value={`${Math.max(experiences.length - visibleTickets.length, 0)}`} />
      </View>

      {loading ? <Text style={styles.metaText}>Sincronizando tickets...</Text> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          {demoTickets.length > 0 ? <Text style={styles.metaText}>Mostrando wallet demo hasta reconectar.</Text> : null}
        </View>
      ) : null}

      {visibleTickets.length > 0 ? (
        visibleTickets.map(({ experience, ticket }) => (
          <Pressable key={`${experience.id}-${ticket.code}`} style={styles.ticketCard} onPress={() => onOpenExperience(experience)}>
            <View style={styles.ticketTop}>
              <View style={styles.ticketIcon}>
                <Ionicons name="ticket-outline" size={24} color={colors.success} />
              </View>
              <View style={styles.ticketCopy}>
                <Text style={styles.ticketTitle}>{experience.title}</Text>
                <Text style={styles.ticketMeta}>{experience.time} - {experience.place}</Text>
              </View>
              <StatusBadge
                label={ticket.usedAt || ticket.entitlementStatus === 'USED' ? 'Usado' : labelForStatus(ticket.entitlementStatus ?? 'ACTIVE')}
                tone={ticket.usedAt || ticket.entitlementStatus === 'USED' ? 'neutral' : 'success'}
              />
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Codigo SafePass</Text>
              {ticket.code ? (
                <View style={styles.qrBox}>
                  <QRCode value={ticket.code} size={154} backgroundColor="#FFFFFF" color="#080B12" />
                </View>
              ) : null}
              <Text style={styles.code}>{ticket.code ?? 'PENDIENTE'}</Text>
            </View>

            <View style={styles.ticketFooter}>
              <Text style={styles.footerText}>{ticket.issuedAt ? formatIssuedAt(ticket.issuedAt) : 'Emitido en modo demo'}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Pressable>
        ))
      ) : (
        <EmptyState
          icon="ticket-outline"
          title="Todavia no tenes tickets"
          message="Cuando reserves o compres una entrada, tu SafePass aparece aca listo para mostrar en puerta."
        />
      )}
    </ScrollView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function buildDemoTickets(experiences: Experience[]): WalletTicket[] {
  const firstEvent = experiences.find((experience) => experience.kind === 'Evento') ?? experiences[0];
  if (!firstEvent || isUuid(firstEvent.id)) {
    return [];
  }

  return [
    {
      experience: firstEvent,
      ticket: {
        entitlementId: 'demo-entitlement',
        experienceId: firstEvent.id,
        experienceTitle: firstEvent.title,
        experienceType: firstEvent.kind === 'Evento' ? 'EVENT' : 'PLAN',
        experienceStatus: 'PUBLISHED',
        startsAt: new Date().toISOString(),
        timezone: 'America/Argentina/Buenos_Aires',
        capacity: firstEvent.attendees,
        registrationId: 'demo-registration',
        registrationStatus: 'REGISTERED',
        entitlementStatus: 'ACTIVE',
        code: 'EVT-DEMO-4829',
        issuedAt: new Date().toISOString(),
        usedAt: null,
      },
    },
  ];
}

function toExperience(ticket: WalletTicketResponse, experiences: Experience[], index: number): Experience {
  const existingExperience = experiences.find((experience) => experience.id === ticket.experienceId);
  if (existingExperience) {
    return existingExperience;
  }

  const fallback = fallbackExperiences[index % fallbackExperiences.length];
  const kind = ticket.experienceType === 'EVENT' ? 'Evento' : ticket.experienceType === 'PLAN' ? 'Plan' : 'Propuesta';
  return {
    id: ticket.experienceId,
    title: ticket.experienceTitle,
    kind,
    time: formatStartsAt(ticket.startsAt),
    place: fallback.place,
    price: kind === 'Evento' ? 'Entrada emitida' : 'Gratis',
    status: 'Asistiras',
    attendees: ticket.capacity ?? fallback.attendees,
    distance: fallback.distance,
    trustLabel: ticket.entitlementStatus === 'ACTIVE' ? 'SafePass activo' : labelForStatus(ticket.entitlementStatus),
    imageUrl: fallback.imageUrl,
    tags: [kind, ticket.experienceStatus, ticket.registrationStatus],
  };
}

function formatStartsAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha a confirmar';
  }
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatIssuedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha de emision no disponible';
  }
  return `Emitido ${new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)}`;
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
  summary: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    marginTop: 2,
    fontWeight: '800',
    fontSize: 12,
  },
  ticketCard: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 12,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ticketIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCopy: {
    flex: 1,
  },
  ticketTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  ticketMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  codeBox: {
    minHeight: 256,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
  },
  qrBox: {
    width: 174,
    height: 174,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLabel: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  code: {
    color: colors.text,
    marginTop: 6,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    color: colors.muted,
    fontWeight: '800',
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
  errorBox: {
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 6,
  },
});
