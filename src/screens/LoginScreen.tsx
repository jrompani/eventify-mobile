import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { login, socialLogin } from '../api/auth';
import { getGoogleIdToken } from '../auth/googleAuth';
import { AuthButton } from '../components/AuthButton';
import { AuthField } from '../components/AuthField';
import { SocialAuthButtons, SocialProvider } from '../components/SocialAuthButtons';
import { FACEBOOK_CLIENT_ID } from '../config/env';
import { colors } from '../theme/colors';
import { AuthSession } from '../types/auth';
import { validateEmail, validatePassword } from '../utils/validation';

type LoginScreenProps = {
  onBack: () => void;
  onAuthenticated: (session: AuthSession) => void;
};

export function LoginScreen({ onBack, onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const validationError = validateEmail(email) ?? validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await login({ email: email.trim(), password });
      onAuthenticated({ email: email.trim(), password, accessToken: response.accessToken, user: response.user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  }

  async function completeGoogleLogin() {
    setSocialSubmitting(true);
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      const response = await socialLogin({ provider: 'GOOGLE', idToken });
      onAuthenticated({ email: response.user.email, accessToken: response.accessToken, user: response.user });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo iniciar sesion con Google');
    } finally {
      setSocialSubmitting(false);
    }
  }

  function handleSocialLogin(provider: SocialProvider) {
    if (provider === 'google') {
      void completeGoogleLogin();
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
      <Text style={styles.title}>Iniciar sesion</Text>
      <Text style={styles.copy}>Usa tu email y contrasena para sincronizar perfil, tickets y grupos.</Text>
      <AuthField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="tu@email.com" />
      <AuthField label="Contrasena" value={password} onChangeText={setPassword} secureTextEntry placeholder="Tu clave secreta" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton label={submitting ? 'Ingresando...' : 'Ingresar'} onPress={submit} disabled={submitting || !email.trim() || !password} />
      <SocialAuthButtons disabled={submitting || socialSubmitting} onPressProvider={handleSocialLogin} />
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
