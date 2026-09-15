import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { updateProfile } from '../api/auth';
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initials = initialsFor(session.user.profile.displayName || session.user.email);

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
        <LabeledValue label="Blocks activos" value="0" />
      </FormBlock>

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
