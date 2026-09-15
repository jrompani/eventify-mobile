import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { register } from '../api/auth';
import { AuthButton } from '../components/AuthButton';
import { AuthField } from '../components/AuthField';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';

type RegisterScreenProps = {
  onBack: () => void;
  onAuthenticated: (session: AuthSession) => void;
};

export function RegisterScreen({ onBack, onAuthenticated }: RegisterScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        username: username.trim() || undefined,
      });
      onAuthenticated({ email: email.trim(), password, user: response.user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.copy}>Tu identidad social vive en una sola cuenta. Despues podras crear, asistir y chatear.</Text>
      <AuthField label="Nombre visible" value={displayName} onChangeText={setDisplayName} placeholder="Juan Cruz" autoCapitalize="words" />
      <AuthField label="Username" value={username} onChangeText={setUsername} placeholder="juancruz_ba" />
      <AuthField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="tu@email.com" />
      <AuthField label="Contrasena" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimo 8 caracteres" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton
        label={submitting ? 'Creando...' : 'Crear cuenta'}
        onPress={submit}
        disabled={submitting || !displayName || !email || password.length < 8}
      />
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
  back: {
    color: colors.primary,
    fontWeight: '900',
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
