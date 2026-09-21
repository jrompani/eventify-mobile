import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthSession } from '../types/auth';

const SESSION_KEY = 'eventify.session.v1';

export async function loadSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const session = JSON.parse(raw) as unknown;
    if (!isValidSession(session)) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    await AsyncStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export async function saveSession(session: AuthSession) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

function isValidSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;
  return typeof session.email === 'string'
    && session.email.includes('@')
    && ((typeof session.password === 'string' && session.password.length > 0)
      || (typeof session.accessToken === 'string' && session.accessToken.length > 0))
    && Boolean(session.user)
    && typeof session.user?.id === 'string'
    && typeof session.user?.email === 'string'
    && Boolean(session.user?.profile);
}
