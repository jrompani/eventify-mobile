import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { listMyAttendance, AttendanceRecord } from '../api/attendance';
import { updateProfile } from '../api/auth';
import { getVerifications, getRestrictions, Restriction, Verification } from '../api/identityTrust';
import { getProfileOverview, ProfileOverview } from '../api/profile';
import { getProgression, XpSummary } from '../api/progression';
import { getReputation, ReputationSummary } from '../api/reputation';
import { FormBlock } from '../components/FormBlock';
import { LabeledValue } from '../components/LabeledValue';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';

type ProfileScreenProps = {
  session: AuthSession;
  onLogout: () => void;
  onSessionUpdated: (session: AuthSession) => void;
};

export function ProfileScreen({ session, onLogout, onSessionUpdated }: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(session.user.profile.displayName ?? '');
  const [username, setUsername] = useState(session.user.profile.username ?? '');
  const [publicZone, setPublicZone] = useState(session.user.profile.publicZone ?? '');
  const [bio, setBio] = useState(session.user.profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [progression, setProgression] = useState<XpSummary | null>(null);
  const [reputation, setReputation] = useState<ReputationSummary | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
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
      const [nextOverview, nextVerifications, nextRestrictions, nextAttendance, nextProgression, nextReputation] = await Promise.all([
        getProfileOverview(session),
        getVerifications(session),
        getRestrictions(session),
        listMyAttendance(session),
        getProgression(session),
        getReputation(session),
      ]);
      setOverview(nextOverview);
      setVerifications(nextVerifications);
      setRestrictions(nextRestrictions);
      setAttendance(nextAttendance);
      setProgression(nextProgression);
      setReputation(nextReputation);
      setDisplayName(nextOverview.user.profile.displayName ?? '');
      setUsername(nextOverview.user.profile.username ?? '');
      setPublicZone(nextOverview.user.profile.publicZone ?? '');
      setBio(nextOverview.user.profile.bio ?? '');
    } catch (exception) {
      setProfileError(exception instanceof Error ? exception.message : 'No se pudo cargar el perfil completo');
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updatedUser = await updateProfile(
        { email: session.email, password: session.password },
        {
          displayName: displayName.trim() || session.user.email,
          username: username.trim() || undefined,
          publicZone: publicZone.trim() || undefined,
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

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <View style={styles.profileHead}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initials}</Text>
        </View>
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

      <FormBlock>
        <LabeledValue label="Zona publica" value={user.profile.publicZone ?? 'No configurada'} />
        <LabeledValue label="Entradas activas" value={`${stats?.activeTicketCount ?? 0}`} />
        <LabeledValue label="Asistencias verificadas" value={`${stats?.checkedInCount ?? reputation?.attendedCount ?? 0}`} />
        <LabeledValue label="Experiencias creadas" value={`${stats?.createdExperienceCount ?? 0}`} />
        <LabeledValue label="Notificaciones sin leer" value={`${stats?.unreadNotificationCount ?? 0}`} />
        <LabeledValue label="Restricciones activas" value={`${restrictions.length}`} />
      </FormBlock>

      <View style={styles.statsGrid}>
        <StatCard icon="flash-outline" label="Nivel" value={`${progression?.level ?? 1}`} detail={`${progression?.totalXp ?? 0} XP`} />
        <StatCard icon="shield-checkmark-outline" label="Reputacion" value={`${reputation?.reputationScore ?? 50}`} detail={bandLabel(reputation?.reputationBand)} />
        <StatCard icon="checkmark-done-outline" label="Asistencias" value={`${reputation?.attendedCount ?? 0}`} detail={`${reputation?.noShowCount ?? 0} no-show`} />
        <StatCard icon="ticket-outline" label="Registrado" value={`${stats?.registeredExperienceCount ?? 0}`} detail="experiencias" />
      </View>

      <View style={styles.editor}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Progreso</Text>
          <Text style={styles.blockMeta}>{progression ? `${progression.currentLevelXp}/${progression.nextLevelXp} XP` : 'Sin datos'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent(progression)}%` }]} />
        </View>
        {progression?.recentEntries.length ? (
          progression.recentEntries.slice(0, 3).map((entry) => (
            <Text key={entry.id} style={styles.listLine}>
              {entry.points > 0 ? '+' : ''}{entry.points} XP - {entry.reason}
            </Text>
          ))
        ) : (
          <Text style={styles.metaText}>Todavia no hay movimientos de XP.</Text>
        )}
      </View>

      <View style={styles.editor}>
        <Text style={styles.blockTitle}>Asistencia verificada</Text>
        {attendance.length > 0 ? (
          attendance.slice(0, 4).map((record) => (
            <View key={record.id} style={styles.attendanceRow}>
              <View style={styles.attendanceIcon}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.attendanceCopy}>
                <Text style={styles.rowTitle}>{record.experienceTitle}</Text>
                <Text style={styles.rowMeta}>{record.status} - {record.evidenceType} - {formatDate(record.recordedAt)}</Text>
              </View>
              <Text style={styles.evidencePill}>{record.evidenceStrength}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>Cuando hagas check-in, tu asistencia aparece aca.</Text>
        )}
      </View>

      <View style={styles.editor}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Confianza y permisos</Text>
          <Text style={styles.blockMeta}>{capabilities?.requiresReview ? 'Requiere revision' : 'Activo'}</Text>
        </View>
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
                {type}: {verification?.status ?? 'PENDING'}
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

      <View style={styles.editor}>
        <Text style={styles.blockTitle}>Editar perfil</Text>
        <Field label="Nombre visible" value={displayName} onChangeText={setDisplayName} placeholder="Juan Cruz" />
        <Field label="Usuario" value={username} onChangeText={setUsername} placeholder="juancruz" />
        <Field label="Zona publica" value={publicZone} onChangeText={setPublicZone} placeholder="Palermo, BA" />
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

      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Cerrar sesion</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
};

function Field({ label, value, onChangeText, placeholder, multiline }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        multiline={multiline}
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

function initialsFor(value: string) {
  return value
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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
  blockMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  retryBox: {
    borderRadius: 8,
    borderColor: colors.danger,
    borderWidth: 1,
    backgroundColor: colors.black,
    padding: 10,
    gap: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
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
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '900',
  },
});
