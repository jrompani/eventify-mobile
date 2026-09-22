import { AuthSession } from '../types/auth';

const REFRESH_SKEW_MS = 24 * 60 * 60 * 1000;

export function authOptionsFor(session: AuthSession) {
  if (session.accessToken) {
    return { bearerToken: session.accessToken };
  }
  if (session.password) {
    return {
      basicAuth: {
        email: session.email,
        password: session.password,
      },
    };
  }
  throw new Error('La sesion no tiene credenciales validas.');
}

export function shouldRefreshSession(session: AuthSession, now = Date.now()) {
  if (!session.accessToken || !session.accessTokenExpiresAt) {
    return false;
  }
  const expiresAt = Date.parse(session.accessTokenExpiresAt);
  return Number.isFinite(expiresAt) && expiresAt - now <= REFRESH_SKEW_MS;
}
