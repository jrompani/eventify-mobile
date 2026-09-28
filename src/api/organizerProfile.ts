import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { ApiExperience, toExperience } from './experiences';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type ApiOrganizerProfile = {
  userId: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  publicZone: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followedByMe: boolean;
  notifyOnNewEvents: boolean;
  upcomingExperiences: ApiExperience[];
};

export type OrganizerProfile = Omit<ApiOrganizerProfile, 'upcomingExperiences'> & {
  upcomingExperiences: Experience[];
};

export async function getOrganizerProfile(session: AuthSession, userId: string) {
  const response = await apiFetch<ApiOrganizerProfile>(`/users/${userId}/organizer-profile`, {
    ...authOptionsFor(session),
  });
  return toOrganizerProfile(response);
}

export async function followOrganizer(session: AuthSession, userId: string, notifyOnNewEvents: boolean) {
  const response = await apiFetch<ApiOrganizerProfile>(`/users/${userId}/organizer-profile/follow`, {
    method: 'POST',
    ...authOptionsFor(session),
    body: JSON.stringify({ notifyOnNewEvents }),
  });
  return toOrganizerProfile(response);
}

export async function unfollowOrganizer(session: AuthSession, userId: string) {
  const response = await apiFetch<ApiOrganizerProfile>(`/users/${userId}/organizer-profile/follow`, {
    method: 'DELETE',
    ...authOptionsFor(session),
  });
  return toOrganizerProfile(response);
}

function toOrganizerProfile(response: ApiOrganizerProfile): OrganizerProfile {
  return {
    ...response,
    upcomingExperiences: response.upcomingExperiences.map(toExperience),
  };
}
