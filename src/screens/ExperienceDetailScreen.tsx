import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommerceOrder, createOrder, listTicketProducts, markOrderPaid, TicketProduct } from '../api/commerce';
import {
  cancelExperienceRegistration,
  getMyTicket,
  markInterested,
  MyTicketResponse,
  registerForExperience,
  RegistrationResult,
} from '../api/registrations';
import { blockUser, createReport, ReportReason } from '../api/trustSafety';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';
import { initialsFor, isUuid } from '../utils/format';
import { labelForStatus } from '../utils/statusLabels';

type ExperienceDetailScreenProps = {
  experience: Experience;
  session: AuthSession;
  onBack: () => void;
  onOpenOrganizer?: () => void;
  onOpenOrganizerProfile?: (userId: string) => void;
  onOpenWallet?: () => void;
};

export function ExperienceDetailScreen({ experience, session, onBack, onOpenOrganizer, onOpenOrganizerProfile, onOpenWallet }: ExperienceDetailScreenProps) {
  const [interested, setInterested] = useState(false);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [participation, setParticipation] = useState<RegistrationResult | null>(initialParticipationFor(experience));
  const [interestLoading, setInterestLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<MyTicketResponse | null>(null);
  const [ticketProducts, setTicketProducts] = useState<TicketProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<CommerceOrder | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('SAFETY_RISK');
  const [safetyLoading, setSafetyLoading] = useState(false);
  const canUseApi = isUuid(experience.id);
  const canBlockOrganizer = Boolean(experience.ownerUserId && experience.ownerUserId !== session.user.id);
  const isOwner = experience.ownerUserId === session.user.id;
  const organizerLabel = isOwner ? 'Tu organizacion' : experience.organizer?.displayName ?? 'Organizador';
  const organizerMeta = isOwner
    ? 'Evento creado por tu cuenta'
    : [experience.organizer?.username ? `@${experience.organizer.username}` : null, experience.organizer?.publicZone]
      .filter(Boolean)
      .join(' - ') || 'Perfil publico del organizador';
  const selectedProduct = ticketProducts.find((product) => product.id === selectedProductId) ?? ticketProducts[0] ?? null;
  const checkoutDisabled = canUseApi
    && (!selectedProduct || checkoutLoading || selectedProduct.status !== 'ACTIVE' || selectedProduct.availableQuantity <= 0);

  useEffect(() => {
    if (canUseApi) {
      void loadCommerce();
    }
  }, [canUseApi, experience.id]);

  async function loadCommerce() {
    setLoadingProducts(true);
    try {
      const products = await listTicketProducts(experience.id);
      setTicketProducts(products);
      setSelectedProductId((current) => current ?? products.find((product) => product.status === 'ACTIVE')?.id ?? products[0]?.id ?? null);
    } catch {
      setTicketProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

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

  async function handleCheckout() {
    if (!canUseApi || !selectedProduct) {
      setActionMessage('Checkout confirmado en modo demo.');
      return;
    }

    setCheckoutLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const idempotencyKey = `mobile-${experience.id}-${selectedProduct.id}-${Date.now()}`;
      const order = await createOrder(session, experience.id, selectedProduct.id, 1, idempotencyKey);
      setCheckoutOrder(order);
      setActionMessage('Orden creada. Podes confirmar pago mock.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo crear la orden');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!checkoutOrder) {
      return;
    }

    setCheckoutLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const paidOrder = await markOrderPaid(session, checkoutOrder.id);
      setCheckoutOrder(paidOrder);
      setParticipation('REGISTERED');
      setActionMessage('Pago confirmado. SafePass emitido.');
      try {
        const nextTicket = await getMyTicket(session, experience.id);
        setTicket(nextTicket.code ? nextTicket : null);
      } catch {
        setTicket(null);
      }
      await loadCommerce();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo marcar la orden como pagada');
    } finally {
      setCheckoutLoading(false);
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

  async function handleReportExperience() {
    setActionError(null);
    setActionMessage(null);

    if (!canUseApi) {
      setActionMessage('Reporte registrado en modo demo.');
      return;
    }

    setSafetyLoading(true);
    try {
      await createReport(session, 'EXPERIENCE', experience.id, reportReason, `Reporte desde detalle: ${experience.title}`);
      setActionMessage('Reporte enviado. El equipo de seguridad lo va a revisar.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo enviar el reporte');
    } finally {
      setSafetyLoading(false);
    }
  }

  function confirmReportExperience() {
    Alert.alert(
      'Reportar experiencia',
      'Usa reportes para fraude, acoso, riesgo real o contenido que rompa las reglas. El equipo revisa el caso y puede pedir mas informacion.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reportar', style: 'destructive', onPress: () => void handleReportExperience() },
      ]
    );
  }

  async function handleBlockOrganizer() {
    if (!experience.ownerUserId || experience.ownerUserId === session.user.id) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setSafetyLoading(true);
    try {
      await blockUser(session, experience.ownerUserId);
      setActionMessage('Organizador bloqueado. Se limitaran interacciones y mensajes.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo bloquear al organizador');
    } finally {
      setSafetyLoading(false);
    }
  }

  function confirmBlockOrganizer() {
    if (!canBlockOrganizer) {
      return;
    }
    Alert.alert(
      'Bloquear organizador',
      'Vas a limitar interacciones y mensajes con este organizador. No se le avisa que lo bloqueaste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Bloquear', style: 'destructive', onPress: () => void handleBlockOrganizer() },
      ]
    );
  }

  function openOrganizerProfile() {
    if (experience.ownerUserId) {
      onOpenOrganizerProfile?.(experience.ownerUserId);
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
            {experience.ageMin ? <InfoPill icon="id-card-outline" label={`+${experience.ageMin}`} tone="warning" /> : null}
          </View>
          {experience.ageMin ? (
            <Text style={styles.ageRequirement}>Requiere verificacion de edad para reservar, comprar y hacer check-in.</Text>
          ) : null}

          <Pressable style={styles.organizerCard} onPress={openOrganizerProfile} disabled={!experience.ownerUserId}>
            {experience.organizer?.avatarUrl ? (
              <Image source={{ uri: experience.organizer.avatarUrl }} style={styles.organizerAvatarImage} />
            ) : (
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerInitial}>{initialsFor(organizerLabel)}</Text>
              </View>
            )}
            <View style={styles.organizerCopy}>
              <Text style={styles.organizerTitle}>{organizerLabel}</Text>
              <Text style={styles.organizerMeta}>{organizerMeta}</Text>
            </View>
            <Text style={styles.followText}>{isOwner ? 'Owner' : 'Ver'}</Text>
          </Pressable>

          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>Seguridad</Text>
              <Ionicons name="shield-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.blockMeta}>Reportar envia este evento a revision. Bloquear afecta tus interacciones con el organizador.</Text>
            <View style={styles.reasonRow}>
              {reportReasons.map((reason) => (
                <Pressable
                  key={reason.value}
                  style={[styles.reasonButton, reportReason === reason.value && styles.reasonButtonActive]}
                  onPress={() => setReportReason(reason.value)}
                >
                  <Text style={[styles.reasonText, reportReason === reason.value && styles.reasonTextActive]}>{reason.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.safetyActions}>
              <Pressable style={[styles.safetyButton, (safetyLoading || isOwner) && styles.disabled]} onPress={confirmReportExperience} disabled={safetyLoading || isOwner}>
                <Ionicons name="flag-outline" size={17} color={colors.danger} />
                <Text style={styles.safetyButtonText}>Reportar</Text>
              </Pressable>
              <Pressable
                style={[styles.safetyButton, (!canBlockOrganizer || safetyLoading) && styles.disabled]}
                onPress={confirmBlockOrganizer}
                disabled={!canBlockOrganizer || safetyLoading}
              >
                <Ionicons name="ban-outline" size={17} color={colors.danger} />
                <Text style={styles.safetyButtonText}>Bloquear organizador</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Con quien voy?</Text>
            <Text style={styles.blockMeta}>Los grupos y asistentes aparecen cuando haya registrations reales.</Text>
            <View style={styles.peopleRow}>
              {peoplePreviewFor(experience).map((person) => (
                <View key={person} style={styles.personBubble}>
                  <Text style={styles.personText}>{person}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Seleccion de entrada</Text>
            {loadingProducts ? <Text style={styles.blockMeta}>Cargando productos...</Text> : null}
            {ticketProducts.length > 0 ? (
              ticketProducts.map((product) => (
                <Pressable
                  key={product.id}
                  style={[styles.ticketRow, selectedProductId === product.id && styles.ticketRowSelected]}
                  onPress={() => setSelectedProductId(product.id)}
                  disabled={product.status !== 'ACTIVE' || product.availableQuantity <= 0}
                >
                  <View>
                    <Text style={styles.ticketTitle}>{product.name}</Text>
                    <Text style={styles.ticketStatus}>
                      {labelForStatus(product.status)} - {product.availableQuantity} disponibles
                    </Text>
                  </View>
                  <Text style={styles.ticketPrice}>{formatMoney(product.priceAmount, product.currency)}</Text>
                </Pressable>
              ))
            ) : !canUseApi ? (
              <>
                <TicketRow title="General Early Bird" price={experience.price} status="Disponible" />
                <TicketRow title="General Lote 2" price="$35.000" status="Quedan pocas" />
              </>
            ) : (
              <View style={styles.emptyProducts}>
                <Ionicons name="pricetag-outline" size={20} color={colors.muted} />
                <Text style={styles.emptyProductsText}>
                  {isOwner ? 'Crea un producto desde Organizer para habilitar checkout.' : 'Todavia no hay entradas disponibles.'}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.checkoutButton, checkoutDisabled && styles.disabled]}
              onPress={handleCheckout}
              disabled={checkoutDisabled}
            >
              <Ionicons name="card-outline" size={18} color={colors.black} />
              <Text style={styles.checkoutText}>{checkoutLoading ? 'Procesando...' : canUseApi ? 'Crear orden' : 'Checkout demo'}</Text>
            </Pressable>
          {checkoutOrder ? (
              <View style={styles.orderBox}>
                <View>
                  <Text style={styles.orderTitle}>Orden {labelForStatus(checkoutOrder.status)}</Text>
                  <Text style={styles.orderMeta}>{formatMoney(checkoutOrder.totalAmount, checkoutOrder.currency)}</Text>
                </View>
                <Pressable
                  style={[styles.payButton, (checkoutOrder.status === 'PAID' || checkoutLoading) && styles.disabled]}
                  onPress={handleMarkPaid}
                  disabled={checkoutOrder.status === 'PAID' || checkoutLoading}
                >
                  <Text style={styles.payText}>{checkoutOrder.status === 'PAID' ? 'Pagado' : 'Marcar pagada'}</Text>
                </Pressable>
              </View>
            ) : null}
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

          {checkoutOrder?.status === 'PAID' || ticket ? (
            <View style={styles.postCheckoutBox}>
              <View style={styles.postCheckoutIcon}>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
              </View>
              <View style={styles.postCheckoutCopy}>
                <Text style={styles.postCheckoutTitle}>Checkout completado</Text>
                <Text style={styles.postCheckoutMeta}>Tu SafePass ya esta emitido y listo para wallet/check-in.</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.nextActions}>
            {ticket ? (
              <Pressable style={styles.nextActionButton} onPress={onOpenWallet}>
                <Ionicons name="ticket-outline" size={18} color={colors.black} />
                <Text style={styles.nextActionText}>Ver Wallet</Text>
              </Pressable>
            ) : null}
            {checkoutOrder?.status === 'PAID' && !ticket ? (
              <Pressable style={styles.nextActionButton} onPress={onOpenWallet}>
                <Ionicons name="ticket-outline" size={18} color={colors.black} />
                <Text style={styles.nextActionText}>Abrir Wallet</Text>
              </Pressable>
            ) : null}
            {isOwner ? (
              <Pressable style={styles.secondaryActionButton} onPress={onOpenOrganizer}>
                <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryActionText}>Operar en Organizer</Text>
              </Pressable>
            ) : null}
          </View>

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

function initialParticipationFor(experience: Experience): RegistrationResult | null {
  if (experience.viewerRegistration?.registered || experience.viewerRegistrationStatus === 'REGISTERED' || experience.status === 'Asistiras') {
    return 'REGISTERED';
  }
  return null;
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
  return `Accion completada: ${labelForStatus(result)}.`;
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

const reportReasons: Array<{ value: ReportReason; label: string }> = [
  { value: 'SAFETY_RISK', label: 'Riesgo' },
  { value: 'FRAUD', label: 'Fraude' },
  { value: 'HARASSMENT', label: 'Acoso' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenido' },
  { value: 'OTHER', label: 'Otro' },
];

function InfoPill({ icon, label, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: 'success' | 'primary' | 'warning' }) {
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.primary;
  const backgroundColor = tone === 'success' ? colors.successSoft : tone === 'warning' ? '#30240D' : colors.primarySoft;

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

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('es-AR')}`;
}

function peoplePreviewFor(experience: Experience) {
  const count = Math.min(Math.max(experience.attendees, 0), 3);
  const base = ['A', 'B', 'C'].slice(0, count);
  return experience.attendees > 3 ? [...base, '+'] : base.length > 0 ? base : ['0'];
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
    flexWrap: 'wrap',
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
  ageRequirement: {
    color: colors.warning,
    fontWeight: '800',
    lineHeight: 19,
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
  organizerAvatarImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
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
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonButtonActive: {
    borderColor: colors.danger,
    backgroundColor: '#31101B',
  },
  reasonText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  reasonTextActive: {
    color: colors.danger,
  },
  safetyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  safetyButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
  },
  safetyButtonText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 12,
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
  ticketRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
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
  emptyProducts: {
    minHeight: 58,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyProductsText: {
    flex: 1,
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 19,
  },
  checkoutButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checkoutText: {
    color: colors.black,
    fontWeight: '900',
  },
  orderBox: {
    minHeight: 62,
    borderRadius: 8,
    borderColor: colors.borderLight,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  orderMeta: {
    color: colors.muted,
    marginTop: 3,
    fontWeight: '800',
  },
  payButton: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  payText: {
    color: colors.black,
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
  postCheckoutBox: {
    minHeight: 68,
    borderRadius: 8,
    borderColor: '#16533F',
    borderWidth: 1,
    backgroundColor: colors.successSoft,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postCheckoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCheckoutCopy: {
    flex: 1,
  },
  postCheckoutTitle: {
    color: colors.success,
    fontWeight: '900',
  },
  postCheckoutMeta: {
    color: colors.text,
    marginTop: 3,
    fontWeight: '700',
    lineHeight: 18,
    fontSize: 12,
  },
  nextActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nextActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  nextActionText: {
    color: colors.black,
    fontWeight: '900',
  },
  secondaryActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: colors.primary,
    fontWeight: '900',
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

