import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const [publicZone, setPublicZone] = useState(session.user.profile.publicZone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(session.user.profile.avatarUrl ?? '');
  const [birthYear, setBirthYear] = useState(session.user.profile.birthYear ? `${session.user.profile.birthYear}` : '');
  const [interests, setInterests] = useState<string[]>(session.user.profile.interests ?? []);
  const [bio, setBio] = useState(session.user.profile.bio ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const user = await updateProfile(
        session,
        {
          displayName: displayName.trim(),
          username: username.trim(),
          publicZone: publicZone.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          birthYear: parseBirthYear(birthYear),
          interests,
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
      <AuthField label="Foto de perfil URL" value={avatarUrl} onChangeText={setAvatarUrl} placeholder="https://..." />
      <AuthField label="Anio de nacimiento" value={birthYear} onChangeText={setBirthYear} placeholder="1998" keyboardType="number-pad" />
      <AuthField label="Zona publica" value={publicZone} onChangeText={setPublicZone} placeholder="Tu barrio o ciudad" />
      <View style={styles.interestsBlock}>
        <Text style={styles.interestsTitle}>Intereses</Text>
        <View style={styles.interestsGrid}>
          {interestOptions.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                style={[styles.interestChip, selected && styles.interestChipActive]}
                onPress={() => setInterests((current) => toggleInterest(current, interest))}
              >
                <Text style={[styles.interestText, selected && styles.interestTextActive]}>{interest}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <AuthField label="Bio" value={bio} onChangeText={setBio} multiline placeholder="Musica, rooftops, planes tranquilos..." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton label={submitting ? 'Guardando...' : 'Continuar al home'} onPress={submit} disabled={submitting || !displayName} />
      <AuthButton label="Completar despues" onPress={() => onDone(session)} variant="secondary" />
    </ScrollView>
  );
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
  interestsBlock: {
    gap: 8,
  },
  interestsTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    minHeight: 34,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  interestChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  interestText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  interestTextActive: {
    color: colors.primary,
  },
});
