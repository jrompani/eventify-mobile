import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { register, socialLogin } from '../api/auth';
import { getGoogleIdToken } from '../auth/googleAuth';
import { AuthButton } from '../components/AuthButton';
import { AuthField } from '../components/AuthField';
import { SocialAuthButtons, SocialProvider } from '../components/SocialAuthButtons';
import { FACEBOOK_CLIENT_ID } from '../config/env';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { validateDisplayName, validateEmail, validatePassword, validateUsername } from '../utils/validation';

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
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const validationError = validateDisplayName(displayName)
      ?? validateUsername(username)
      ?? validateEmail(email)
      ?? validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        username: username.trim() || undefined,
      });
      onAuthenticated({ email: email.trim(), password, accessToken: response.accessToken, user: response.user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  async function completeGoogleRegister() {
    setSocialSubmitting(true);
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      const response = await socialLogin({ provider: 'GOOGLE', idToken });
      onAuthenticated({ email: response.user.email, accessToken: response.accessToken, user: response.user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo continuar con Google');
    } finally {
      setSocialSubmitting(false);
    }
  }

  function handleSocialRegister(provider: SocialProvider) {
    if (provider === 'google') {
      void completeGoogleRegister();
      return;
    }

    if (!FACEBOOK_CLIENT_ID) {
      setError('Para activar Facebook falta EXPO_PUBLIC_FACEBOOK_CLIENT_ID y el endpoint social del backend.');
      return;
    }
    setError('Facebook todavia no esta conectado. Google ya esta preparado.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>Volver</Text>
      </Pressable>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.copy}>Tu identidad social vive en una sola cuenta. Despues podras crear, asistir y chatear.</Text>
      <AuthField label="Nombre visible" value={displayName} onChangeText={setDisplayName} placeholder="Tu nombre" autoCapitalize="words" />
      <AuthField label="Username" value={username} onChangeText={setUsername} placeholder="tu_usuario" />
      <AuthField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="tu@email.com" />
      <AuthField label="Contrasena" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimo 8 caracteres" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton
        label={submitting ? 'Creando...' : 'Crear cuenta'}
        onPress={submit}
        disabled={submitting || !displayName.trim() || !email.trim() || password.length < 8}
      />
      <SocialAuthButtons disabled={submitting || socialSubmitting} onPressProvider={handleSocialRegister} />
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
