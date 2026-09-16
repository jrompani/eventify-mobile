import { apiFetch } from './client';
import { AuthSession } from '../types/auth';

export type OrganizerEventSummary = {
  id: string;
  type: 'PROPOSAL' | 'PLAN' | 'EVENT';
  title: string;
  status: string;
  visibility: string;
  startsAt: string;
  timezone: string;
  capacity: number | null;
  registeredCount: number;
  pendingRequestCount: number;
  waitlistCount: number;
  checkedInCount: number;
  ticketProductCount: number;
  paidOrderCount: number;
  grossSalesAmount: number;
  grossSalesCurrency: string;
};

export type OrganizerEventPage = {
  content: OrganizerEventSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type OrganizerRequest = {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerAttendee = {
  registrationId: string;
  userId: string;
  userEmail: string;
  status: string;
  registeredAt: string;
};

export type OrganizerWaitlistEntry = {
  id: string;
  userId: string;
  userEmail: string;
  status: string;
  position: number;
  joinedAt: string;
};

export type OrganizerStaff = {
  id: string;
  userId: string;
  userEmail: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerTicketProduct = {
  id: string;
  name: string;
  priceAmount: number;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
  availableQuantity: number;
  status: string;
};

export type OrganizerAuditEvent = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: string | null;
  createdAt: string;
};

export type OrganizerDashboard = {
  summary: OrganizerEventSummary;
  pendingRequests: OrganizerRequest[];
  attendees: OrganizerAttendee[];
  waitlist: OrganizerWaitlistEntry[];
  staff: OrganizerStaff[];
  ticketProducts: OrganizerTicketProduct[];
  recentAuditEvents: OrganizerAuditEvent[];
};

export type CheckInResponse = {
  id: string;
  experienceId: string;
  registrationId: string;
  userId: string;
  userEmail: string;
  status: string;
  checkedAt: string;
  checkedByUserId: string;
};

export type RegistrationActionResponse = {
  result: string;
  experienceId: string;
  userId: string;
  registrationId: string | null;
  waitlistEntryId: string | null;
  waitlistPosition: number | null;
  reason: string | null;
  occurredAt: string;
};

export async function listOrganizerEvents(session: AuthSession) {
  return apiFetch<OrganizerEventPage>('/organizer/events?page=0&size=20', {
    basicAuth: basicAuthFor(session),
  });
}

export async function getOrganizerDashboard(session: AuthSession, experienceId: string) {
  return apiFetch<OrganizerDashboard>(`/organizer/events/${experienceId}/dashboard`, {
    basicAuth: basicAuthFor(session),
  });
}

export async function approveOrganizerRequest(session: AuthSession, experienceId: string, requestId: string) {
  return apiFetch<RegistrationActionResponse>(`/organizer/events/${experienceId}/requests/${requestId}/approve`, {
    method: 'POST',
    basicAuth: basicAuthFor(session),
  });
}

export async function rejectOrganizerRequest(session: AuthSession, experienceId: string, requestId: string) {
  return apiFetch<RegistrationActionResponse>(`/organizer/events/${experienceId}/requests/${requestId}/reject`, {
    method: 'POST',
    basicAuth: basicAuthFor(session),
  });
}

export async function checkInByEntitlementCode(session: AuthSession, experienceId: string, entitlementCode: string) {
  return apiFetch<CheckInResponse>(`/organizer/events/${experienceId}/check-ins`, {
    method: 'POST',
    basicAuth: basicAuthFor(session),
    body: JSON.stringify({ entitlementCode }),
  });
}

function basicAuthFor(session: AuthSession) {
  return {
    email: session.email,
    password: session.password,
  };
}
