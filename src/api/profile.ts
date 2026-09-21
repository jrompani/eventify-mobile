import { apiFetch } from './client';
import { Capabilities } from './identityTrust';
import { authOptionsFor } from './sessionAuth';
import { AuthSession, User } from '../types/auth';

export type ProfileStats = {
  createdExperienceCount: number;
  registeredExperienceCount: number;
  checkedInCount: number;
  activeTicketCount: number;
  unreadNotificationCount: number;
};

export type ProfileOverview = {
  user: User;
  capabilities: Capabilities;
  stats: ProfileStats;
};

export async function getProfileOverview(session: AuthSession) {
  return apiFetch<ProfileOverview>('/me/profile-overview', {
    ...authOptionsFor(session),
  });
}
