import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { updateProfile } from '../api/auth';
import { AuthButton } from '../components/AuthButton';
import { AuthField } from '../components/AuthField';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';

type ProfileSetupScreenProps = {
  session: AuthSession;
  onDone: (session: AuthSession) => void;
};

export function ProfileSetupScreen({ session, onDone }: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(session.user.profile.displayName ?? '');
  const [username, setUsername] = useState(session.user.profile.username ?? '');
  const [publicZone, setPublicZone] = useState(session.user.profile.publicZone ?? 'Palermo, BA');
  const [bio, setBio] = useState(session.user.profile.bio ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const user = await updateProfile(
        { email: session.email, password: session.password },
        {
          displayName: displayName.trim(),
          username: username.trim(),
          publicZone: publicZone.trim(),
          bio: bio.trim(),
        }
      );
      onDone({ ...session, user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar el perfil');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>Paso 2 de 2</Text>
      <Text style={styles.title}>Preferencias iniciales</Text>
      <Text style={styles.copy}>Esto ayuda a mostrar experiencias compatibles sin exponer ubicacion precisa.</Text>
      <AuthField label="Nombre visible" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <AuthField label="Username" value={username} onChangeText={setUsername} />
      <AuthField label="Zona publica" value={publicZone} onChangeText={setPublicZone} />
      <AuthField label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Musica, rooftops, planes tranquilos..." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton label={submitting ? 'Guardando...' : 'Continuar al home'} onPress={submit} disabled={submitting || !displayName} />
      <AuthButton label="Completar despues" onPress={() => onDone(session)} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
    gap: 14,
  },
  kicker: {
    color: colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  copy: {
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 21,
  },
  error: {
    color: colors.danger,
    fontWeight: '800',
  },
});
