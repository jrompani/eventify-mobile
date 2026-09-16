import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { updateProfile } from '../api/auth';
import { Capabilities, getCapabilities, getRestrictions, getVerifications, Restriction, Verification } from '../api/identityTrust';
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
  const [loadingTrust, setLoadingTrust] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trustError, setTrustError] = useState<string | null>(null);
  const initials = initialsFor(session.user.profile.displayName || session.user.email);

  useEffect(() => {
    void loadTrustState();
  }, [session.email]);

  async function loadTrustState() {
    setLoadingTrust(true);
    setTrustError(null);
    try {
      const [nextCapabilities, nextVerifications, nextRestrictions] = await Promise.all([
        getCapabilities(session),
        getVerifications(session),
        getRestrictions(session),
      ]);
      setCapabilities(nextCapabilities);
      setVerifications(nextVerifications);
      setRestrictions(nextRestrictions);
    } catch (exception) {
      setTrustError(exception instanceof Error ? exception.message : 'No se pudo cargar confianza y permisos');
    } finally {
      setLoadingTrust(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const user = await updateProfile(
        { email: session.email, password: session.password },
        {
          displayName: displayName.trim() || session.user.email,
          username: username.trim() || undefined,
          publicZone: publicZone.trim() || undefined,
          bio: bio.trim() || undefined,
        }
      );
      onSessionUpdated({ ...session, user });
      setMessage('Perfil actualizado.');
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
          <Text style={styles.screenTitle}>{session.user.profile.displayName || session.user.email}</Text>
          <Text style={styles.rowMeta}>{session.user.profile.username ?? session.user.email}</Text>
        </View>
      </View>

      <FormBlock>
        <LabeledValue label="Zona publica" value={session.user.profile.publicZone ?? 'No configurada'} />
        <LabeledValue label="Entradas activas" value="1" />
        <LabeledValue label="Asistencias verificadas" value="4" />
        <LabeledValue label="Restricciones activas" value={`${restrictions.length}`} />
      </FormBlock>

      <View style={styles.editor}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Confianza y permisos</Text>
          <Pressable style={styles.iconButton} onPress={loadTrustState} disabled={loadingTrust}>
            <Text style={styles.iconButtonText}>↻</Text>
          </Pressable>
        </View>
        {loadingTrust ? <Text style={styles.metaText}>Cargando permisos...</Text> : null}
        {trustError ? (
          <View style={styles.retryBox}>
            <Text style={styles.errorText}>{trustError}</Text>
            <Pressable style={styles.retryButton} onPress={loadTrustState}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}
        {capabilities ? (
          <View style={styles.capabilityGrid}>
            <Capability label="Registro" enabled={capabilities.canRegister} />
            <Capability label="Crear" enabled={capabilities.canCreateExperience} />
            <Capability label="Chat" enabled={capabilities.canUseChat} />
            <Capability label="Verified" enabled={capabilities.canAccessVerifiedOnly} />
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

function Capability({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <View style={[styles.capability, enabled ? styles.capabilityOn : styles.capabilityOff]}>
      <Text style={[styles.capabilityText, enabled ? styles.capabilityTextOn : styles.capabilityTextOff]}>
        {label}: {enabled ? 'OK' : 'Bloqueado'}
      </Text>
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
  rowMeta: {
    color: colors.muted,
    marginTop: 3,
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
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 16,
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
