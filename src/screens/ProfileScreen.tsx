import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { listMyAttendance, AttendanceRecord } from '../api/attendance';
import { updateProfile } from '../api/auth';
import { getVerifications, getRestrictions, Restriction, Verification } from '../api/identityTrust';
import { getProfileOverview, ProfileOverview } from '../api/profile';
import { getProgression, XpSummary } from '../api/progression';
import { getReputation, ReputationSummary } from '../api/reputation';
import { BlockResponse, listMyBlocks, unblockUser } from '../api/trustSafety';
import { EmptyState } from '../components/EmptyState';
import { FormBlock } from '../components/FormBlock';
import { LabeledValue } from '../components/LabeledValue';
import { RetryMessage } from '../components/RetryMessage';
import { SectionHeader } from '../components/SectionHeader';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { formatShortDate, initialsFor } from '../utils/format';
import { labelForStatus } from '../utils/statusLabels';
import { validateBirthYear, validateDisplayName, validateOptionalUrl, validateUsername } from '../utils/validation';

type ProfileScreenProps = {
  session: AuthSession;
  onLogout: () => void;
  onSessionUpdated: (session: AuthSession) => void;
};

type ProfileSheet = 'profile' | 'progress' | 'attendance' | 'trust' | 'blocks' | 'edit';

export function ProfileScreen({ session, onLogout, onSessionUpdated }: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(session.user.profile.displayName ?? '');
  const [username, setUsername] = useState(session.user.profile.username ?? '');
  const [publicZone, setPublicZone] = useState(session.user.profile.publicZone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(session.user.profile.avatarUrl ?? '');
  const [birthYear, setBirthYear] = useState(session.user.profile.birthYear ? `${session.user.profile.birthYear}` : '');
  const [interests, setInterests] = useState<string[]>(session.user.profile.interests ?? []);
  const [bio, setBio] = useState(session.user.profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [progression, setProgression] = useState<XpSummary | null>(null);
  const [reputation, setReputation] = useState<ReputationSummary | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [blocks, setBlocks] = useState<BlockResponse[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<ProfileSheet | null>(null);
  const user = overview?.user ?? session.user;
  const capabilities = overview?.capabilities ?? null;
  const stats = overview?.stats ?? null;
  const initials = initialsFor(user.profile.displayName || user.email);

  useEffect(() => {
    void loadProfileData();
  }, [session.email]);

  async function loadProfileData() {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const [nextOverview, nextVerifications, nextRestrictions, nextAttendance, nextProgression, nextReputation, nextBlocks] = await Promise.all([
        getProfileOverview(session),
        getVerifications(session),
        getRestrictions(session),
        listMyAttendance(session),
        getProgression(session),
        getReputation(session),
        listMyBlocks(session),
      ]);
      setOverview(nextOverview);
      setVerifications(nextVerifications);
      setRestrictions(nextRestrictions);
      setAttendance(nextAttendance);
      setProgression(nextProgression);
      setReputation(nextReputation);
      setBlocks(nextBlocks);
      setDisplayName(nextOverview.user.profile.displayName ?? '');
      setUsername(nextOverview.user.profile.username ?? '');
      setPublicZone(nextOverview.user.profile.publicZone ?? '');
      setAvatarUrl(nextOverview.user.profile.avatarUrl ?? '');
      setBirthYear(nextOverview.user.profile.birthYear ? `${nextOverview.user.profile.birthYear}` : '');
      setInterests(nextOverview.user.profile.interests ?? []);
      setBio(nextOverview.user.profile.bio ?? '');
    } catch (exception) {
      setProfileError(exception instanceof Error ? exception.message : 'No se pudo cargar el perfil completo');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSave() {
    const validationError = validateDisplayName(displayName)
      ?? validateUsername(username)
      ?? validateOptionalUrl(avatarUrl, 'La foto de perfil')
      ?? validateBirthYear(birthYear);
    if (validationError) {
      setMessage(null);
      setError(validationError);
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updatedUser = await updateProfile(
        session,
        {
          displayName: displayName.trim() || session.user.email,
          username: username.trim() || undefined,
          publicZone: publicZone.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
          birthYear: parseBirthYear(birthYear),
          interests,
          bio: bio.trim() || undefined,
        }
      );
      onSessionUpdated({ ...session, user: updatedUser });
      setOverview((current) => current ? { ...current, user: updatedUser } : current);
      setMessage('Perfil actualizado.');
      await loadProfileData();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  }

  async function handleUnblock(userId: string) {
    setUnblockingId(userId);
    setMessage(null);
    setError(null);
    try {
      await unblockUser(session, userId);
      setBlocks((currentBlocks) => currentBlocks.filter((block) => block.blockedUserId !== userId));
      setMessage('Usuario desbloqueado.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo desbloquear al usuario');
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.profileHead}>
        {user.profile.avatarUrl ? (
          <Image source={{ uri: user.profile.avatarUrl }} style={styles.profileAvatarImage} />
        ) : (
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.profileCopy}>
          <Text style={styles.screenTitle}>{user.profile.displayName || user.email}</Text>
          <Text style={styles.rowMeta}>{user.profile.username ?? user.email}</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={loadProfileData} disabled={loadingProfile}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {loadingProfile ? <Text style={styles.metaText}>Sincronizando perfil...</Text> : null}
      {profileError ? <RetryMessage message={profileError} onRetry={loadProfileData} /> : null}

      <View style={styles.profileSummary}>
        <View style={styles.summaryLine}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Zona publica</Text>
            <Text style={styles.summaryValue}>{user.profile.publicZone ?? 'No configurada'}</Text>
          </View>
        </View>
        <View style={styles.summaryLine}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryLabel}>Edad</Text>
            <Text style={styles.summaryValue}>{ageLabel(user.profile.birthYear)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="flash-outline" label="Nivel" value={`${progression?.level ?? 1}`} detail={`${progression?.totalXp ?? 0} XP`} />
        <StatCard icon="shield-checkmark-outline" label="Reputacion" value={`${reputation?.reputationScore ?? 50}`} detail={bandLabel(reputation?.reputationBand)} />
        <StatCard icon="checkmark-done-outline" label="Asistencias" value={`${reputation?.attendedCount ?? 0}`} detail={`${reputation?.noShowCount ?? 0} no-show`} />
        <StatCard icon="ticket-outline" label="Registrado" value={`${stats?.registeredExperienceCount ?? 0}`} detail="experiencias" />
      </View>

      <View style={styles.actionPanel}>
        <SectionHeader title="Ajustes y actividad" meta="Toca para ver" />
        <View style={styles.actionGrid}>
          <ActionTile icon="person-outline" title="Datos publicos" detail="Zona, edad y perfil" onPress={() => setActiveSheet('profile')} />
          <ActionTile icon="create-outline" title="Editar perfil" detail="Nombre, foto e intereses" onPress={() => setActiveSheet('edit')} />
          <ActionTile icon="checkmark-circle-outline" title="Asistencias" detail={`${stats?.checkedInCount ?? reputation?.attendedCount ?? 0} verificadas`} onPress={() => setActiveSheet('attendance')} />
          <ActionTile icon="shield-checkmark-outline" title="Confianza" detail={`${restrictions.length} restricciones`} onPress={() => setActiveSheet('trust')} />
          <ActionTile icon="flash-outline" title="Progreso" detail={progression ? `${progression.currentLevelXp}/${progression.nextLevelXp} XP` : 'Sin datos'} onPress={() => setActiveSheet('progress')} />
          <ActionTile icon="ban-outline" title="Bloqueados" detail={`${blocks.length} usuarios`} danger={blocks.length > 0} onPress={() => setActiveSheet('blocks')} />
        </View>
      </View>

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="swap-horizontal-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Cambiar usuario</Text>
      </Pressable>

      <ProfileModal
        visible={activeSheet === 'profile'}
        title="Datos publicos"
        onClose={() => setActiveSheet(null)}
      >
        <FormBlock>
          <LabeledValue label="Zona publica" value={user.profile.publicZone ?? 'No configurada'} />
          <LabeledValue label="Edad" value={ageLabel(user.profile.birthYear)} />
          <LabeledValue label="Entradas activas" value={`${stats?.activeTicketCount ?? 0}`} />
          <LabeledValue label="Asistencias verificadas" value={`${stats?.checkedInCount ?? reputation?.attendedCount ?? 0}`} />
          <LabeledValue label="Experiencias creadas" value={`${stats?.createdExperienceCount ?? 0}`} />
          <LabeledValue label="Notificaciones sin leer" value={`${stats?.unreadNotificationCount ?? 0}`} />
          <LabeledValue label="Restricciones activas" value={`${restrictions.length}`} />
        </FormBlock>
      </ProfileModal>

      <ProfileModal visible={activeSheet === 'progress'} title="Progreso" onClose={() => setActiveSheet(null)}>
        <View style={styles.editor}>
          <SectionHeader
            title={`Nivel ${progression?.level ?? 1}`}
            meta={progression ? `${progression.currentLevelXp}/${progression.nextLevelXp} XP` : 'Sin datos'}
          />
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent(progression)}%` }]} />
          </View>
          {progression?.recentEntries.length ? (
            progression.recentEntries.slice(0, 6).map((entry) => (
              <Text key={entry.id} style={styles.listLine}>
                {entry.points > 0 ? '+' : ''}{entry.points} XP - {entry.reason}
              </Text>
            ))
          ) : (
            <EmptyState
              icon="flash-outline"
              title="Sin movimientos de XP"
              message="Tu progreso se actualiza cuando participas, haces check-in o completas acciones de confianza."
              compact
            />
          )}
        </View>
      </ProfileModal>

      <ProfileModal visible={activeSheet === 'attendance'} title="Asistencia verificada" onClose={() => setActiveSheet(null)}>
        <View style={styles.editor}>
          {attendance.length > 0 ? (
            attendance.map((record) => (
              <View key={record.id} style={styles.attendanceRow}>
                <View style={styles.attendanceIcon}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                </View>
                <View style={styles.attendanceCopy}>
                  <Text style={styles.rowTitle}>{record.experienceTitle}</Text>
                  <Text style={styles.rowMeta}>{labelForStatus(record.status)} - {labelForStatus(record.evidenceType)} - {formatShortDate(record.recordedAt)}</Text>
                </View>
                <Text style={styles.evidencePill}>{record.evidenceStrength}%</Text>
              </View>
            ))
          ) : (
            <EmptyState
              icon="checkmark-circle-outline"
              title="Sin asistencias verificadas"
              message="Cuando hagas check-in en una experiencia, tu asistencia aparece aca."
              compact
            />
          )}
        </View>
      </ProfileModal>

      <ProfileModal visible={activeSheet === 'trust'} title="Confianza y permisos" onClose={() => setActiveSheet(null)}>
        <View style={styles.editor}>
          <SectionHeader title="Estado de cuenta" meta={capabilities?.requiresReview ? 'Requiere revision' : 'Activo'} />
          {capabilities ? (
            <View style={styles.capabilityGrid}>
              <Capability label="Registro" enabled={capabilities.canRegister} />
              <Capability label="Crear" enabled={capabilities.canCreateExperience} />
              <Capability label="Chat" enabled={capabilities.canUseChat} />
              <Capability label="Check-in" enabled={capabilities.canCheckIn} />
            </View>
          ) : null}
          <View style={styles.chipRow}>
            {['EMAIL', 'IDENTITY', 'AGE'].map((type) => {
              const verification = verifications.find((item) => item.type === type);
              const verified = verification?.status === 'VERIFIED';
              return (
                <Text key={type} style={[styles.trustChip, verified && styles.trustChipOk]}>
                  {labelForStatus(type)}: {labelForStatus(verification?.status ?? 'PENDING')}
                </Text>
              );
            })}
          </View>
          {restrictions.length > 0 ? (
            restrictions.map((restriction) => (
              <Text key={restriction.id} style={styles.restrictionLine}>
                {restriction.type}: {restriction.reason}
              </Text>
            ))
          ) : (
            <Text style={styles.metaText}>Sin restricciones activas.</Text>
          )}
        </View>
      </ProfileModal>

      <ProfileModal visible={activeSheet === 'blocks'} title="Usuarios bloqueados" onClose={() => setActiveSheet(null)}>
        <View style={styles.editor}>
          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {blocks.length > 0 ? (
            blocks.map((block) => (
              <View key={block.id} style={styles.blockedRow}>
                <View style={styles.blockedIcon}>
                  <Ionicons name="ban-outline" size={18} color={colors.danger} />
                </View>
                <View style={styles.blockedCopy}>
                  <Text style={styles.rowTitle}>{block.blockedUserEmail}</Text>
                  <Text style={styles.rowMeta}>Bloqueado {formatShortDate(block.createdAt)}</Text>
                </View>
                <Pressable
                  style={[styles.unblockButton, unblockingId === block.blockedUserId && styles.disabled]}
                  onPress={() => handleUnblock(block.blockedUserId)}
                  disabled={unblockingId === block.blockedUserId}
                >
                  <Text style={styles.unblockText}>{unblockingId === block.blockedUserId ? '...' : 'Quitar'}</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <EmptyState
              icon="ban-outline"
              title="No tenes usuarios bloqueados"
              message="Si bloqueas a alguien desde un chat o grupo, vas a poder gestionarlo desde aca."
              compact
            />
          )}
        </View>
      </ProfileModal>

      <ProfileModal visible={activeSheet === 'edit'} title="Editar perfil" onClose={() => setActiveSheet(null)}>
        <View style={styles.editor}>
          <Field label="Nombre visible" value={displayName} onChangeText={setDisplayName} placeholder="Nombre visible" />
          <Field label="Usuario" value={username} onChangeText={setUsername} placeholder="usuario" />
          <Field label="Foto de perfil URL" value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." />
          <Field label="Anio de nacimiento" value={birthYear} onChangeText={setBirthYear} placeholder="1998" keyboardType="number-pad" />
          <Field label="Zona publica" value={publicZone} onChangeText={setPublicZone} placeholder="Tu barrio o ciudad" />
          <View style={styles.interestsBlock}>
            <Text style={styles.label}>Intereses</Text>
            <View style={styles.chipRow}>
              {interestOptions.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    style={[styles.editInterestChip, selected && styles.editInterestChipActive]}
                    onPress={() => setInterests((current) => toggleInterest(current, interest))}
                  >
                    <Text style={[styles.editInterestText, selected && styles.editInterestTextActive]}>{interest}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Musica, planes y preferencias sociales"
            multiline
          />
          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>
        </View>
      </ProfileModal>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
};

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function StatCard({ icon, label, value, detail }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; detail: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

function Capability({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <View style={[styles.capability, enabled ? styles.capabilityOn : styles.capabilityOff]}>
      <Text style={[styles.capabilityText, enabled ? styles.capabilityTextOn : styles.capabilityTextOff]}>
        {label}: {enabled ? 'OK' : 'Bloqueado'}
      </Text>
    </View>
  );
}

function ActionTile({
  icon,
  title,
  detail,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionTile} onPress={onPress}>
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.subtle} style={styles.actionChevron} />
    </Pressable>
  );
}

function ProfileModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function progressPercent(progression: XpSummary | null) {
  if (!progression || progression.nextLevelXp <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((progression.currentLevelXp / progression.nextLevelXp) * 100)));
}

function bandLabel(value: string | undefined) {
  if (value === 'TRUSTED') {
    return 'Confiable';
  }
  if (value === 'POSITIVE') {
    return 'Positiva';
  }
  if (value === 'NEEDS_REVIEW') {
    return 'En revision';
  }
  return 'Inicial';
}

const interestOptions = ['Electronica', 'Rooftops', 'After office', 'Arte', 'Food', 'Networking', 'Outdoor', 'Tranquilo', 'Fiesta'];

function toggleInterest(current: string[], interest: string) {
  return current.includes(interest)
    ? current.filter((item) => item !== interest)
    : [...current, interest];
}

function parseBirthYear(value: string) {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : undefined;
}

function ageLabel(birthYear: number | null) {
  if (!birthYear) {
    return 'No configurada';
  }
  const age = new Date().getFullYear() - birthYear;
  return age > 0 ? `${age}` : 'No configurada';
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
    backgroundColor: colors.background,
  },
  profileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.primarySoft,
  },
  profileAvatarText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0,
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
  profileSummary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  summaryLine: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  summaryValue: {
    color: colors.text,
    marginTop: 2,
    fontWeight: '900',
  },
  editor: {
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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTile: {
    width: '48%',
    minHeight: 126,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 12,
    gap: 7,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: {
    backgroundColor: '#31101B',
  },
  actionTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  actionChevron: {
    position: 'absolute',
    right: 10,
    top: 14,
  },
  statCard: {
    width: '48%',
    minHeight: 112,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  statDetail: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  attendanceRow: {
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
  attendanceIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceCopy: {
    flex: 1,
  },
  evidencePill: {
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
  blockedRow: {
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
  blockedIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#31101B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedCopy: {
    flex: 1,
  },
  unblockButton: {
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  capabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capability: {
    width: '48%',
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  capabilityOn: {
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
  },
  capabilityOff: {
    backgroundColor: colors.black,
    borderColor: colors.danger,
  },
  capabilityText: {
    fontWeight: '900',
    fontSize: 12,
  },
  capabilityTextOn: {
    color: colors.success,
  },
  capabilityTextOff: {
    color: colors.danger,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustChip: {
    color: colors.warning,
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontWeight: '900',
    fontSize: 12,
  },
  trustChipOk: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderColor: '#16533F',
  },
  restrictionLine: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
  metaText: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 20,
  },
  listLine: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 20,
  },
  field: {
    gap: 7,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
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
  textArea: {
    minHeight: 82,
    paddingTop: 11,
    textAlignVertical: 'top',
  },
  interestsBlock: {
    gap: 8,
  },
  editInterestChip: {
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  editInterestChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  editInterestText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  editInterestTextActive: {
    color: colors.primary,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: colors.black,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.6,
  },
  successText: {
    color: colors.success,
    fontWeight: '800',
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  modalSheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    paddingTop: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  modalContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 28,
    gap: 12,
  },
});
