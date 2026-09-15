import { apiFetch } from './client';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

export type RegistrationResult =
  | 'REGISTERED'
  | 'REQUESTED'
  | 'WAITLISTED'
  | 'INELIGIBLE'
  | 'INTERESTED'
  | 'REMOVED'
  | string;

export type RegistrationActionResponse = {
  result: RegistrationResult;
  experienceId: string;
  userId: string;
  registrationId: string | null;
  waitlistEntryId: string | null;
  waitlistPosition: number | null;
  reason: string | null;
  occurredAt: string;
};

export type MyTicketResponse = {
  entitlementId: string | null;
  experienceId: string;
  registrationId: string | null;
  userId: string;
  status: string | null;
  code: string | null;
  issuedAt: string | null;
  usedAt: string | null;
};

export async function markInterested(session: AuthSession, experienceId: string) {
  return apiFetch<RegistrationActionResponse>(`/experiences/${experienceId}/interest`, {
    method: 'POST',
    basicAuth: basicAuthFor(session),
  });
}

export async function registerForExperience(session: AuthSession, experience: Experience) {
  const path = experience.status.toLowerCase().includes('solicitar')
    ? `/experiences/${experience.id}/requests`
    : `/experiences/${experience.id}/registrations`;

  return apiFetch<RegistrationActionResponse>(path, {
    method: 'POST',
    basicAuth: basicAuthFor(session),
  });
}

export async function getMyTicket(session: AuthSession, experienceId: string) {
  return apiFetch<MyTicketResponse>(`/experiences/${experienceId}/my-ticket`, {
    basicAuth: basicAuthFor(session),
  });
}

function basicAuthFor(session: AuthSession) {
  return {
    email: session.email,
    password: session.password,
  };
}
