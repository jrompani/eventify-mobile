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
};

export type UpdateProfileInput = {
  displayName?: string;
  username?: string;
  bio?: string;
  publicZone?: string;
  avatarUrl?: string;
  birthYear?: number;
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

export function logout(session: AuthSession) {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export function updateProfile(session: AuthSession, input: UpdateProfileInput) {
  return apiFetch<User>('/me/profile', {
    method: 'PATCH',
    ...authOptionsFor(session),
    body: JSON.stringify(input),
  });
}
