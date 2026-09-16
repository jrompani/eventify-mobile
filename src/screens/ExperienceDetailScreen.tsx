import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  cancelExperienceRegistration,
  getMyTicket,
  markInterested,
  MyTicketResponse,
  registerForExperience,
  RegistrationResult,
} from '../api/registrations';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type ExperienceDetailScreenProps = {
  experience: Experience;
  session: AuthSession;
  onBack: () => void;
};

export function ExperienceDetailScreen({ experience, session, onBack }: ExperienceDetailScreenProps) {
  const [interested, setInterested] = useState(false);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [participation, setParticipation] = useState<RegistrationResult | null>(null);
  const [interestLoading, setInterestLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<MyTicketResponse | null>(null);
  const canUseApi = isUuid(experience.id);

  async function handleInterest() {
    setActionError(null);
    setActionMessage(null);

    if (!canUseApi) {
      setInterested(true);
      setActionMessage('Marcado como interesante en modo demo.');
      return;
    }

    setInterestLoading(true);
    try {
      await markInterested(session, experience.id);
      setInterested(true);
      setActionMessage('Te avisamos si hay movimiento relevante.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo marcar interes');
    } finally {
      setInterestLoading(false);
    }
  }

  async function handleJoin() {
    setActionError(null);
    setActionMessage(null);

    if (!canUseApi) {
      setParticipation(experience.status.toLowerCase().includes('solicitar') ? 'REQUESTED' : 'REGISTERED');
      setActionMessage(experience.status.toLowerCase().includes('solicitar') ? 'Solicitud enviada en modo demo.' : 'Reserva confirmada en modo demo.');
      return;
    }

    setJoining(true);
    try {
      const response = await registerForExperience(session, experience);
      setParticipation(response.result);
      setActionMessage(messageForRegistration(response.result, response.waitlistPosition));

      try {
        const nextTicket = await getMyTicket(session, experience.id);
        setTicket(nextTicket.code ? nextTicket : null);
      } catch {
        setTicket(null);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo completar la accion');
    } finally {
      setJoining(false);
    }
  }

  async function handleCancelParticipation() {
    setActionError(null);
    setActionMessage(null);

    if (!canUseApi) {
      setParticipation(null);
      setTicket(null);
      setActionMessage('Participacion cancelada en modo demo.');
      return;
    }

    setCancelling(true);
    try {
      const response = await cancelExperienceRegistration(session, experience, participation);
      setParticipation(null);
      setTicket(null);
      setActionMessage(messageForCancellation(response.result));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo cancelar la participacion');
    } finally {
      setCancelling(false);
    }
  }

  const joined = isJoined(participation);
  const ctaLabel = joining ? 'Procesando...' : labelForParticipation(participation, experience.status);
  const cancelLabel = labelForCancel(participation);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ImageBackground source={{ uri: experience.imageUrl }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTop}>
              <Pressable style={styles.iconButton} onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver">
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable style={styles.iconButton} onPress={handleInterest} disabled={interestLoading || interested}>
                  <Ionicons
                    name={interested ? 'heart' : 'heart-outline'}
                    size={20}
                    color={interested ? colors.danger : colors.text}
                  />
                </Pressable>
                <View style={styles.iconButton}>
                  <Ionicons name="share-social-outline" size={20} color={colors.text} />
                </View>
              </View>
            </View>
            <View>
              <Text style={styles.kind}>{experience.kind}</Text>
              <Text style={styles.title}>{experience.title}</Text>
              <Text style={styles.meta}>
                {experience.time} - {experience.place} - {experience.distance}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <View style={styles.trustRow}>
            <InfoPill icon="shield-checkmark-outline" label={experience.trustLabel} tone="success" />
            <InfoPill icon="people-outline" label={`${experience.attendees} compatibles`} tone="primary" />
          </View>

          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerInitial}>B</Text>
            </View>
            <View style={styles.organizerCopy}>
              <Text style={styles.organizerTitle}>BNP Producciones</Text>
              <Text style={styles.organizerMeta}>Organizador verificado - 84% asistencia confirmada</Text>
            </View>
            <Text style={styles.followText}>Seguir</Text>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Con quien voy?</Text>
            <Text style={styles.blockMeta}>Hay 27 personas compatibles con tus intereses y privacidad activa.</Text>
            <View style={styles.peopleRow}>
              {['J', 'V', 'A', '+'].map((person) => (
                <View key={person} style={styles.personBubble}>
                  <Text style={styles.personText}>{person}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Seleccion de entrada</Text>
            <TicketRow title="General Early Bird" price={experience.price} status="Disponible" />
            <TicketRow title="General Lote 2" price="$35.000" status="Quedan pocas" />
          </View>

          {ticket ? (
            <View style={styles.ticketCard}>
              <View style={styles.ticketIcon}>
                <Ionicons name="ticket-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.ticketCopy}>
                <Text style={styles.ticketCardTitle}>SafePass emitido</Text>
                <Text style={styles.ticketCode}>{ticket.code}</Text>
              </View>
            </View>
          ) : null}

          {actionMessage ? <Text style={styles.successText}>{actionMessage}</Text> : null}
          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.stickyCta}>
        <View>
          <Text style={styles.priceLabel}>Precio general</Text>
          <Text style={styles.price}>{experience.price}</Text>
        </View>
        <View style={styles.ctaActions}>
          <Pressable style={[styles.ctaButton, (joining || joined) && styles.disabled]} onPress={handleJoin} disabled={joining || joined}>
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
          {joined ? (
            <Pressable style={[styles.cancelButton, cancelling && styles.disabled]} onPress={handleCancelParticipation} disabled={cancelling}>
              <Text style={styles.cancelText}>{cancelling ? 'Cancelando...' : cancelLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function messageForRegistration(result: string, waitlistPosition: number | null) {
  if (result === 'REGISTERED') {
    return 'Reserva confirmada. Tu SafePass queda asociado a esta experiencia.';
  }
  if (result === 'REQUESTED') {
    return 'Solicitud enviada. El organizador puede aprobarla desde su panel.';
  }
  if (result === 'WAITLISTED') {
    return waitlistPosition ? `Lista de espera: puesto ${waitlistPosition}.` : 'Entraste en lista de espera.';
  }
  if (result === 'INELIGIBLE') {
    return 'No cumplis los requisitos para esta experiencia.';
  }
  return `Accion completada: ${result}.`;
}

function messageForCancellation(result: string) {
  if (result === 'CANCELLED') {
    return 'Asistencia cancelada. Tu SafePass fue revocado.';
  }
  if (result === 'REQUEST_CANCELLED') {
    return 'Solicitud cancelada.';
  }
  if (result === 'WAITLIST_REMOVED') {
    return 'Saliste de la lista de espera.';
  }
  return 'Participacion cancelada.';
}

function isJoined(result: RegistrationResult | null) {
  return result === 'REGISTERED'
    || result === 'ALREADY_REGISTERED'
    || result === 'REQUESTED'
    || result === 'ALREADY_REQUESTED'
    || result === 'WAITLISTED'
    || result === 'ALREADY_WAITLISTED';
}

function labelForParticipation(result: RegistrationResult | null, fallback: string) {
  if (result === 'REGISTERED' || result === 'ALREADY_REGISTERED') {
    return 'Asistiras';
  }
  if (result === 'REQUESTED' || result === 'ALREADY_REQUESTED') {
    return 'Solicitud enviada';
  }
  if (result === 'WAITLISTED' || result === 'ALREADY_WAITLISTED') {
    return 'En espera';
  }
  return fallback;
}

function labelForCancel(result: RegistrationResult | null) {
  if (result === 'REQUESTED' || result === 'ALREADY_REQUESTED') {
    return 'Cancelar solicitud';
  }
  if (result === 'WAITLISTED' || result === 'ALREADY_WAITLISTED') {
    return 'Salir de espera';
  }
  return 'Cancelar asistencia';
}

function InfoPill({ icon, label, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: 'success' | 'primary' }) {
  const color = tone === 'success' ? colors.success : colors.primary;
  const backgroundColor = tone === 'success' ? colors.successSoft : colors.primarySoft;

  return (
    <View style={[styles.infoPill, { backgroundColor }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.infoPillText, { color }]}>{label}</Text>
    </View>
  );
}

function TicketRow({ title, price, status }: { title: string; price: string; status: string }) {
  return (
    <View style={styles.ticketRow}>
      <View>
        <Text style={styles.ticketTitle}>{title}</Text>
        <Text style={styles.ticketStatus}>{status}</Text>
      </View>
      <Text style={styles.ticketPrice}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  hero: {
    height: 330,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 6, 10, 0.44)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 6, 10, 0.76)',
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kind: {
    alignSelf: 'flex-start',
    color: colors.inverse,
    fontWeight: '900',
    backgroundColor: 'rgba(143, 70, 255, 0.86)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  meta: {
    color: colors.muted,
    marginTop: 8,
    fontWeight: '800',
  },
  section: {
    padding: 14,
    gap: 12,
  },
  trustRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoPillText: {
    fontWeight: '900',
    fontSize: 12,
  },
  organizerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  organizerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInitial: {
    color: colors.primary,
    fontWeight: '900',
  },
  organizerCopy: {
    flex: 1,
  },
  organizerTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  organizerMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '700',
    fontSize: 12,
  },
  followText: {
    color: colors.primary,
    fontWeight: '900',
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
    fontSize: 18,
    fontWeight: '900',
  },
  blockMeta: {
    color: colors.muted,
    fontWeight: '700',
  },
  peopleRow: {
    flexDirection: 'row',
  },
  personBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  personText: {
    color: colors.primary,
    fontWeight: '900',
  },
  ticketRow: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  ticketStatus: {
    color: colors.success,
    marginTop: 3,
    fontWeight: '800',
    fontSize: 12,
  },
  ticketPrice: {
    color: colors.text,
    fontWeight: '900',
  },
  stickyCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 86,
    padding: 14,
    backgroundColor: colors.black,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceLabel: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 12,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  ctaButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.black,
    fontWeight: '900',
  },
  ctaActions: {
    alignItems: 'stretch',
    gap: 8,
  },
  cancelButton: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.danger,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  ticketCard: {
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCopy: {
    flex: 1,
  },
  ticketCardTitle: {
    color: colors.success,
    fontWeight: '900',
  },
  ticketCode: {
    color: colors.text,
    marginTop: 3,
    fontWeight: '900',
    letterSpacing: 0,
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
