import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type EventGroup = {
  id: string;
  experienceId: string;
  createdByUserId: string;
  createdByEmail: string;
  name: string;
  description: string | null;
  visibility: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  userEmail: string;
  role: string;
  status: string;
  joinedAt: string;
  updatedAt: string;
};

export async function listGroups(session: AuthSession, experienceId: string) {
  return apiFetch<EventGroup[]>(`/experiences/${experienceId}/groups`, {
    ...authOptionsFor(session),
  });
}

export async function createGroup(session: AuthSession, experienceId: string, name: string, description: string) {
  return apiFetch<EventGroup>(`/experiences/${experienceId}/groups`, {
    method: 'POST',
    ...authOptionsFor(session),
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export async function joinGroup(session: AuthSession, experienceId: string, groupId: string) {
  return apiFetch<GroupMember>(`/experiences/${experienceId}/groups/${groupId}/members`, {
    method: 'POST',
    ...authOptionsFor(session),
  });
}
