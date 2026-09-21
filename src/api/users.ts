import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type UserSearchResult = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  publicZone: string | null;
  avatarUrl: string | null;
  interests: string[];
};

export async function searchUsers(session: AuthSession, query: string) {
  return apiFetch<UserSearchResult[]>(`/users/search?query=${encodeURIComponent(query)}`, {
    ...authOptionsFor(session),
  });
}
