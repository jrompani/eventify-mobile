import { apiFetch } from './client';
import { AuthResponse, User } from '../types/auth';

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

export type UpdateProfileInput = {
  displayName?: string;
  username?: string;
  bio?: string;
  publicZone?: string;
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

export function updateProfile(credentials: LoginInput, input: UpdateProfileInput) {
  return apiFetch<User>('/me/profile', {
    method: 'PATCH',
    basicAuth: credentials,
    body: JSON.stringify(input),
  });
}
