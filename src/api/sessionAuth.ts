import { AuthSession } from '../types/auth';

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
