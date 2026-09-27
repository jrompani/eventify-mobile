import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthResponse, AuthSession, User } from '../types/auth';

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  username?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SocialLoginInput = {
  provider: 'GOOGLE';
  idToken: string;
  accessToken?: string;
  createIfMissing?: boolean;
};

export type UpdateProfileInput = {
  displayName?: string;
  username?: string;
  bio?: string;
  publicZone?: string;
  avatarUrl?: string;
  birthDate?: string;
  birthYear?: number;
  gender?: 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  interests?: string[];
};

export function register(input: RegisterInput) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function socialLogin(input: SocialLoginInput) {
  return apiFetch<AuthResponse>('/auth/social', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function refreshSession(session: AuthSession) {
  return apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export function logout(session: AuthSession) {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export function logoutAll(session: AuthSession) {
  return apiFetch<void>('/auth/logout-all', {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export function sessionFromAuthResponse(response: AuthResponse): AuthSession {
  return {
    email: response.user.email,
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    user: response.user,
  };
}

export function updateProfile(session: AuthSession, input: UpdateProfileInput) {
  return apiFetch<User>('/me/profile', {
    method: 'PATCH',
    ...authOptionsFor(session),
    body: JSON.stringify(input),
  });
}
