import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  addOrganizerStaff,
  approveOrganizerRequest,
  checkInByEntitlementCode,
  checkInByRegistrationId,
  CheckInRosterEntry,
  getOrganizerDashboard,
  listCheckInRoster,
  OrganizerDashboard,
  OrganizerEventSummary,
  OrganizerStaffRole,
  rejectOrganizerRequest,
  listOrganizerEvents,
  removeOrganizerStaff,
} from '../api/organizer';
import { createTicketProduct } from '../api/commerce';
import { searchUsers, UserSearchResult } from '../api/users';
import { EmptyState } from '../components/EmptyState';
import { RetryMessage } from '../components/RetryMessage';
import { SectionHeader } from '../components/SectionHeader';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { formatShortDate, initialsFor } from '../utils/format';
import { labelForStatus } from '../utils/statusLabels';

type OrganizerScreenProps = {
  session: AuthSession;
  preferredExperienceId?: string | null;
};

export function OrganizerScreen({ session, preferredExperienceId }: OrganizerScreenProps) {
  const [events, setEvents] = useState<OrganizerEventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<OrganizerDashboard | null>(null);
  const [roster, setRoster] = useState<CheckInRosterEntry[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [rosterQuery, setRosterQuery] = useState('');
  const [checkingRosterRegistrationId, setCheckingRosterRegistrationId] = useState<string | null>(null);
  const [staffUserId, setStaffUserId] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedStaffUser, setSelectedStaffUser] = useState<UserSearchResult | null>(null);
  const [searchingStaff, setSearchingStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<OrganizerStaffRole>('CHECKIN_STAFF');
  const [savingStaff, setSavingStaff] = useState(false);
  const [removingStaffUserId, setRemovingStaffUserId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    if (preferredExperienceId && events.some((event) => event.id === preferredExperienceId)) {
      setSelectedEventId(preferredExperienceId);
    }
  }, [preferredExperienceId, events]);

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
      setSelectedEventId((current) => {
        if (preferredExperienceId && page.content.some((event) => event.id === preferredExperienceId)) {
          return preferredExperienceId;
        }
        return current ?? page.content[0]?.id ?? null;
      });
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
    setLoadingRoster(true);
    setError(null);
    try {
      const [nextDashboard, nextRoster] = await Promise.all([
        getOrganizerDashboard(session, experienceId),
        listCheckInRoster(session, experienceId),
      ]);
      setDashboard(nextDashboard);
      setRoster(nextRoster);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el dashboard');
    } finally {
      setLoadingDashboard(false);
      setLoadingRoster(false);
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
      setMessage(`Acceso ${labelForStatus(response.status)}: ${response.userEmail}`);
      setCheckInCode('');
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo confirmar el acceso');
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleRosterCheckIn(entry: CheckInRosterEntry) {
    if (!selectedEventId || entry.checkedIn) {
      return;
    }

    setCheckingRosterRegistrationId(entry.registrationId);
    setError(null);
    setMessage(null);
    try {
      const response = await checkInByRegistrationId(session, selectedEventId, entry.registrationId);
      setMessage(`Acceso ${labelForStatus(response.status)}: ${response.userEmail}`);
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo confirmar el acceso');
    } finally {
      setCheckingRosterRegistrationId(null);
    }
  }

  async function handleAddStaff() {
    const userId = selectedStaffUser?.id ?? staffUserId.trim();
    if (!selectedEventId || !userId) {
      return;
    }

    setSavingStaff(true);
    setError(null);
    setMessage(null);
    try {
      const staff = await addOrganizerStaff(session, selectedEventId, userId, staffRole);
      setMessage(`Staff agregado: ${staff.userEmail}`);
      setStaffUserId('');
      setStaffSearchResults([]);
      setSelectedStaffUser(null);
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo agregar staff');
    } finally {
      setSavingStaff(false);
    }
  }

  async function handleStaffSearch(query: string) {
    setStaffUserId(query);
    setSelectedStaffUser(null);

    if (query.trim().length < 2) {
      setStaffSearchResults([]);
      return;
    }

    setSearchingStaff(true);
    try {
      const results = await searchUsers(session, query);
      setStaffSearchResults(results.filter((user) => user.id !== session.user.id));
    } catch {
      setStaffSearchResults([]);
    } finally {
      setSearchingStaff(false);
    }
  }

  async function handleRemoveStaff(userId: string) {
    if (!selectedEventId) {
      return;
    }

    setRemovingStaffUserId(userId);
    setError(null);
    setMessage(null);
    try {
      const staff = await removeOrganizerStaff(session, selectedEventId, userId);
      setMessage(`Staff removido: ${staff.userEmail}`);
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo remover staff');
    } finally {
      setRemovingStaffUserId(null);
    }
  }

  async function handleCreateProduct() {
    if (!selectedEventId || !productName.trim()) {
      return;
    }

    const priceAmount = Number(productPrice);
    const quantityTotal = Number(productQuantity);
    if (!Number.isFinite(priceAmount) || !Number.isFinite(quantityTotal)) {
      setError('Precio y cantidad deben ser numeros validos');
      return;
    }

    setSavingProduct(true);
    setError(null);
    setMessage(null);
    try {
      const product = await createTicketProduct(session, selectedEventId, {
        name: productName.trim(),
        priceAmount: Math.max(0, Math.round(priceAmount)),
        currency: 'ARS',
        quantityTotal: Math.max(0, Math.round(quantityTotal)),
      });
      setMessage(`Producto creado: ${product.name}`);
      setProductName('');
      setProductPrice('');
      setProductQuantity('');
      await loadDashboard(selectedEventId);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear el producto');
    } finally {
      setSavingProduct(false);
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
                <Text style={styles.eventChipMeta}>{labelForStatus(event.status)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : !loadingEvents ? (
        <EmptyState
          icon="briefcase-outline"
          title="Sin eventos creados"
          message="Cuando publiques una experiencia, aparece aca para operar solicitudes, tickets y puerta."
        />
      ) : null}

      {dashboard ? (
        <>
          <View style={styles.summaryGrid}>
            <Metric label="Registrados" value={`${dashboard.summary.registeredCount}`} />
            <Metric label="Pendientes" value={`${dashboard.summary.pendingRequestCount}`} />
            <Metric label="Check-ins" value={`${dashboard.summary.checkedInCount}`} />
            <Metric label="Ventas" value={formatMoney(dashboard.summary.grossSalesAmount, dashboard.summary.grossSalesCurrency)} />
          </View>

          <View style={styles.gateStatus}>
            <View style={styles.gateIcon}>
              <Ionicons name="scan-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.gateTitle}>Puerta lista</Text>
              <Text style={styles.gateMeta}>
                {roster.filter((entry) => !entry.checkedIn).length} pendientes - {roster.filter((entry) => entry.checkedIn).length} ingresados
              </Text>
            </View>
            <Pressable style={styles.gateRefresh} onPress={() => selectedEventId ? loadDashboard(selectedEventId) : undefined}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </Pressable>
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
                    <Text style={styles.rowMeta}>{labelForStatus(request.status)}</Text>
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
            <SectionHeader title="Roster de puerta" meta={`${roster.filter((entry) => entry.checkedIn).length}/${roster.length} check-in`} />
            <View style={styles.rosterStats}>
              <RosterMetric label="Pendientes" value={`${roster.filter((entry) => !entry.checkedIn).length}`} tone="warning" />
              <RosterMetric label="Ingresados" value={`${roster.filter((entry) => entry.checkedIn).length}`} tone="success" />
            </View>
            <TextInput
              value={rosterQuery}
              onChangeText={setRosterQuery}
              placeholder="Buscar por email, usuario o registro"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoCapitalize="none"
            />
            {filteredRoster(roster, rosterQuery).some((entry) => !entry.checkedIn) ? (
              <Pressable
                style={styles.nextCheckInButton}
                onPress={() => {
                  const nextEntry = filteredRoster(roster, rosterQuery).find((entry) => !entry.checkedIn);
                  if (nextEntry) {
                    void handleRosterCheckIn(nextEntry);
                  }
                }}
                disabled={Boolean(checkingRosterRegistrationId)}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.black} />
                <Text style={styles.nextCheckInText}>
                  {checkingRosterRegistrationId ? 'Confirmando...' : 'Ingresar siguiente pendiente'}
                </Text>
              </Pressable>
            ) : null}
            {loadingRoster ? <Text style={styles.metaText}>Actualizando roster...</Text> : null}
            {filteredRoster(roster, rosterQuery).length > 0 ? (
              filteredRoster(roster, rosterQuery).map((entry) => (
                <View key={entry.registrationId} style={[styles.rosterRow, entry.checkedIn && styles.rosterRowChecked]}>
                  <View style={[styles.rosterIcon, entry.checkedIn && styles.rosterIconChecked]}>
                    <Ionicons
                      name={entry.checkedIn ? 'checkmark-circle-outline' : 'ellipse-outline'}
                      size={20}
                      color={entry.checkedIn ? colors.success : colors.warning}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{entry.userEmail}</Text>
                    <Text style={styles.rowMeta}>
                      {labelForStatus(entry.registrationStatus)} - {entry.checkedIn ? `Check-in ${formatShortDate(entry.checkedAt)}` : 'Pendiente'}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.checkInButton, (entry.checkedIn || checkingRosterRegistrationId === entry.registrationId) && styles.disabled]}
                    onPress={() => handleRosterCheckIn(entry)}
                    disabled={entry.checkedIn || checkingRosterRegistrationId === entry.registrationId}
                  >
                    <Text style={styles.checkInButtonText}>
                      {entry.checkedIn ? 'Dentro' : checkingRosterRegistrationId === entry.registrationId ? '...' : 'Entrar'}
                    </Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>{roster.length > 0 ? 'No hay resultados para la busqueda.' : 'Sin asistentes confirmados.'}</Text>
            )}
          </View>

          <View style={styles.block}>
            <SectionHeader title="Productos y ventas" meta={`${dashboard.ticketProducts.length} productos`} />
            {dashboard.ticketProducts.length === 0 ? (
              <Pressable
                style={styles.firstTicketBox}
                onPress={() => {
                  setProductName('Entrada general');
                  setProductPrice('1000');
                  setProductQuantity(`${Math.max(dashboard.summary.capacity ?? 20, 1)}`);
                }}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>Crear primer ticket</Text>
                  <Text style={styles.rowMeta}>Toca aca para precargar una entrada general y habilitar checkout mock.</Text>
                </View>
              </Pressable>
            ) : null}
            <View style={styles.ticketPresetRow}>
              <Pressable
                style={styles.ticketPreset}
                onPress={() => {
                  setProductName('Entrada general');
                  setProductPrice('1000');
                  setProductQuantity(`${Math.max(dashboard.summary.capacity ?? 20, 1)}`);
                }}
              >
                <Text style={styles.ticketPresetText}>General</Text>
              </Pressable>
              <Pressable
                style={styles.ticketPreset}
                onPress={() => {
                  setProductName('Early bird');
                  setProductPrice('500');
                  setProductQuantity('10');
                }}
              >
                <Text style={styles.ticketPresetText}>Early bird</Text>
              </Pressable>
              <Pressable
                style={styles.ticketPreset}
                onPress={() => {
                  setProductName('Acceso sin cargo');
                  setProductPrice('0');
                  setProductQuantity(`${Math.max(dashboard.summary.capacity ?? 20, 1)}`);
                }}
              >
                <Text style={styles.ticketPresetText}>Gratis</Text>
              </Pressable>
            </View>
            <TextInput
              value={productName}
              onChangeText={setProductName}
              placeholder="Nombre del ticket"
              placeholderTextColor={colors.subtle}
              style={styles.input}
            />
            <View style={styles.productInputs}>
              <TextInput
                value={productPrice}
                onChangeText={setProductPrice}
                placeholder="Precio ARS"
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.productInput]}
                keyboardType="numeric"
              />
              <TextInput
                value={productQuantity}
                onChangeText={setProductQuantity}
                placeholder="Cantidad"
                placeholderTextColor={colors.subtle}
                style={[styles.input, styles.productInput]}
                keyboardType="numeric"
              />
            </View>
            <Pressable
              style={[styles.primaryButton, (!productName.trim() || !productPrice.trim() || !productQuantity.trim() || savingProduct) && styles.disabled]}
              onPress={handleCreateProduct}
              disabled={!productName.trim() || !productPrice.trim() || !productQuantity.trim() || savingProduct}
            >
              <Text style={styles.primaryButtonText}>{savingProduct ? 'Creando...' : 'Crear producto'}</Text>
            </Pressable>
            {dashboard.ticketProducts.length > 0 ? (
              dashboard.ticketProducts.map((product) => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productIcon}>
                    <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{product.name}</Text>
                    <Text style={styles.rowMeta}>
                      {formatMoney(product.priceAmount, product.currency)} - {product.availableQuantity}/{product.quantityTotal} disponibles
                    </Text>
                  </View>
                  <Text style={[styles.productStatus, product.status === 'SOLD_OUT' && styles.productStatusSoldOut]}>{labelForStatus(product.status)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>Todavia no hay productos de ticket.</Text>
            )}
          </View>

          <View style={styles.block}>
            <SectionHeader title="Equipo" meta={`${dashboard.staff.length} activos`} />
            <TextInput
              value={staffUserId}
              onChangeText={handleStaffSearch}
              placeholder="Buscar por usuario, nombre o email"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              autoCapitalize="none"
            />
            {searchingStaff ? <Text style={styles.metaText}>Buscando usuario...</Text> : null}
            {selectedStaffUser ? (
              <View style={styles.selectedUserBox}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                <Text style={styles.selectedUserText}>{labelForUser(selectedStaffUser)}</Text>
              </View>
            ) : null}
            {staffSearchResults.length > 0 ? (
              <View style={styles.searchResults}>
                {staffSearchResults.map((user) => (
                  <Pressable
                    key={user.id}
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSelectedStaffUser(user);
                      setStaffUserId(user.username ?? user.email);
                      setStaffSearchResults([]);
                    }}
                  >
                    <View style={styles.searchResultAvatar}>
                      <Text style={styles.searchResultAvatarText}>{initialsFor(user.displayName || user.email)}</Text>
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{user.displayName || user.email}</Text>
                      <Text style={styles.rowMeta}>{user.username ? `@${user.username}` : user.email}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.roleRow}>
              {staffRoles.map((role) => (
                <Pressable
                  key={role.value}
                  style={[styles.roleButton, staffRole === role.value && styles.roleButtonActive]}
                  onPress={() => setStaffRole(role.value)}
                >
                  <Text style={[styles.roleText, staffRole === role.value && styles.roleTextActive]}>{role.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.primaryButton, (!staffUserId.trim() || savingStaff) && styles.disabled]}
              onPress={handleAddStaff}
              disabled={!staffUserId.trim() || savingStaff}
            >
              <Text style={styles.primaryButtonText}>{savingStaff ? 'Agregando...' : 'Agregar staff'}</Text>
            </Pressable>
            {dashboard.staff.length > 0 ? (
              dashboard.staff.map((staff) => (
                <View key={staff.id} style={styles.staffRow}>
                  <View style={styles.staffIcon}>
                    <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{staff.userEmail}</Text>
                    <Text style={styles.rowMeta}>{labelForStatus(staff.role)} - {labelForStatus(staff.status)}</Text>
                  </View>
                  <Pressable
                    style={[styles.removeButton, removingStaffUserId === staff.userId && styles.disabled]}
                    onPress={() => handleRemoveStaff(staff.userId)}
                    disabled={removingStaffUserId === staff.userId}
                  >
                    <Text style={styles.removeButtonText}>{removingStaffUserId === staff.userId ? '...' : 'Quitar'}</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>No hay staff asignado.</Text>
            )}
          </View>

          <View style={styles.block}>
            <SectionHeader title="Actividad reciente" meta={`${dashboard.recentAuditEvents.length} eventos`} />
            {dashboard.recentAuditEvents.length > 0 ? (
              dashboard.recentAuditEvents.map((event) => (
                <View key={event.id} style={styles.auditRow}>
                  <View style={styles.auditIcon}>
                    <Ionicons name={iconForAudit(event.action)} size={18} color={colors.success} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{labelForAudit(event.action)}</Text>
                    <Text style={styles.rowMeta}>{event.actorEmail} - {formatShortDate(event.createdAt)}</Text>
                    {event.metadata ? <Text style={styles.auditMeta} numberOfLines={2}>{event.metadata}</Text> : null}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.metaText}>Todavia no hay actividad reciente.</Text>
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

function RosterMetric({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' }) {
  const color = tone === 'success' ? colors.success : colors.warning;
  const backgroundColor = tone === 'success' ? colors.successSoft : '#30240D';
  return (
    <View style={[styles.rosterMetric, { backgroundColor }]}>
      <Text style={[styles.rosterMetricValue, { color }]}>{value}</Text>
      <Text style={[styles.rosterMetricLabel, { color }]}>{label}</Text>
    </View>
  );
}

function formatMoney(amount: number, currency: string) {
  if (amount <= 0) {
    return '0';
  }
  return `${currency} ${amount.toLocaleString('es-AR')}`;
}

function filteredRoster(roster: CheckInRosterEntry[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) {
    return roster;
  }

  return roster.filter((entry) =>
    entry.userEmail.toLowerCase().includes(term)
    || entry.userId.toLowerCase().includes(term)
    || entry.registrationId.toLowerCase().includes(term)
  );
}

function labelForUser(user: UserSearchResult) {
  return `${user.displayName || user.email}${user.username ? ` (@${user.username})` : ''}`;
}

const staffRoles: Array<{ value: OrganizerStaffRole; label: string }> = [
  { value: 'CHECKIN_STAFF', label: 'Check-in' },
  { value: 'OWNER_ASSISTANT', label: 'Asistente' },
];

function labelForAudit(action: string) {
  const labels: Record<string, string> = {
    REQUEST_APPROVED: 'Solicitud aprobada',
    REQUEST_REJECTED: 'Solicitud rechazada',
    ENTITLEMENT_ISSUED: 'Ticket emitido',
    ENTITLEMENT_REVOKED: 'Ticket revocado',
    CHECK_IN_CREATED: 'Check-in registrado',
    ATTENDANCE_RECORDED: 'Asistencia verificada',
    STAFF_ADDED: 'Staff agregado',
    STAFF_REMOVED: 'Staff removido',
    WAITLIST_OFFERED: 'Oferta de waitlist',
    WAITLIST_ACCEPTED: 'Waitlist aceptada',
    WAITLIST_DECLINED: 'Waitlist declinada',
  };
  return labels[action] ?? action;
}

function iconForAudit(action: string): keyof typeof Ionicons.glyphMap {
  if (action.includes('REQUEST')) {
    return 'clipboard-outline';
  }
  if (action.includes('STAFF')) {
    return 'people-outline';
  }
  if (action.includes('WAITLIST')) {
    return 'hourglass-outline';
  }
  if (action.includes('CHECK_IN') || action.includes('ATTENDANCE')) {
    return 'scan-outline';
  }
  return 'pulse-outline';
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
  rosterStats: {
    flexDirection: 'row',
    gap: 8,
  },
  gateStatus: {
    minHeight: 72,
    borderRadius: 8,
    borderColor: '#16533F',
    borderWidth: 1,
    backgroundColor: colors.successSoft,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gateIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: {
    color: colors.success,
    fontWeight: '900',
    fontSize: 16,
  },
  gateMeta: {
    color: colors.text,
    marginTop: 3,
    fontWeight: '800',
  },
  gateRefresh: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  firstTicketBox: {
    minHeight: 64,
    borderRadius: 8,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.primarySoft,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ticketPresetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ticketPreset: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketPresetText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  productInput: {
    flex: 1,
  },
  rosterMetric: {
    flex: 1,
    minHeight: 58,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterMetricValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  rosterMetricLabel: {
    marginTop: 2,
    fontSize: 12,
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
  staffRow: {
    minHeight: 62,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedUserBox: {
    minHeight: 38,
    borderRadius: 8,
    borderColor: '#16533F',
    borderWidth: 1,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedUserText: {
    color: colors.success,
    fontWeight: '900',
  },
  searchResults: {
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchResultRow: {
    minHeight: 58,
    backgroundColor: colors.black,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchResultAvatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultAvatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  productRow: {
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productStatus: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontWeight: '900',
    fontSize: 11,
  },
  productStatusSoldOut: {
    color: colors.danger,
    backgroundColor: '#31101B',
    borderColor: colors.danger,
  },
  rosterRow: {
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rosterRowChecked: {
    borderColor: '#16533F',
  },
  rosterIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#30240D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterIconChecked: {
    backgroundColor: colors.successSoft,
  },
  checkInButton: {
    minHeight: 38,
    minWidth: 74,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  checkInButtonText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 12,
  },
  nextCheckInButton: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextCheckInText: {
    color: colors.black,
    fontWeight: '900',
  },
  staffIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleText: {
    color: colors.muted,
    fontWeight: '900',
  },
  roleTextActive: {
    color: colors.primary,
  },
  removeButton: {
    minHeight: 36,
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: colors.danger,
    fontWeight: '900',
    fontSize: 12,
  },
  auditRow: {
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  auditIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditMeta: {
    color: colors.subtle,
    marginTop: 5,
    fontWeight: '700',
    lineHeight: 18,
    fontSize: 12,
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
