import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listMyTickets, WalletTicketResponse } from '../api/registrations';
import { experiences as fallbackExperiences } from '../data/mockExperiences';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoTickets = useMemo(() => buildDemoTickets(experiences), [experiences]);
  const visibleTickets = tickets.length > 0 ? tickets : demoTickets;

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
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar la wallet');
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
              <Text style={[styles.statusPill, ticket.usedAt && styles.usedPill]}>
                {ticket.usedAt || ticket.entitlementStatus === 'USED' ? 'USADO' : ticket.entitlementStatus ?? 'ACTIVO'}
              </Text>
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Codigo SafePass</Text>
              <Text style={styles.code}>{ticket.code ?? 'PENDIENTE'}</Text>
            </View>

            <View style={styles.ticketFooter}>
              <Text style={styles.footerText}>{ticket.issuedAt ? formatIssuedAt(ticket.issuedAt) : 'Emitido en modo demo'}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyTitle}>Todavia no tenes tickets</Text>
          <Text style={styles.emptyMeta}>Cuando te registres a una experiencia, tu SafePass aparece aca.</Text>
        </View>
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
    trustLabel: ticket.entitlementStatus === 'ACTIVE' ? 'SafePass activo' : ticket.entitlementStatus,
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  statusPill: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    overflow: 'hidden',
    fontWeight: '900',
    fontSize: 11,
  },
  usedPill: {
    color: colors.muted,
    backgroundColor: colors.black,
    borderColor: colors.border,
  },
  codeBox: {
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.borderLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
  metaText: {
    color: colors.muted,
    fontWeight: '800',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
});
