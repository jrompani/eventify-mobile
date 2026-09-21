import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
export type VerificationType = 'EMAIL' | 'PHONE' | 'IDENTITY' | 'AGE';
export type RestrictionType = 'NO_CREATE_EXPERIENCE' | 'NO_REGISTRATION' | 'NO_CHAT' | 'NO_CHECK_IN' | 'REQUIRE_REVIEW';

export type Verification = {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  provider: string | null;
  reference: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Restriction = {
  id: string;
  type: RestrictionType;
  status: 'ACTIVE' | 'LIFTED';
  reason: string;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
};

export type Capabilities = {
  emailVerified: boolean;
  identityVerified: boolean;
  ageVerified: boolean;
  canCreateExperience: boolean;
  canRegister: boolean;
  canUseChat: boolean;
  canCheckIn: boolean;
  canAccessVerifiedOnly: boolean;
  canAccessAgeRestricted: boolean;
  requiresReview: boolean;
  activeRestrictions: Restriction[];
};

export async function getVerifications(session: AuthSession) {
  return apiFetch<Verification[]>('/me/verifications', {
    ...authOptionsFor(session),
  });
}

export async function getRestrictions(session: AuthSession) {
  return apiFetch<Restriction[]>('/me/restrictions', {
    ...authOptionsFor(session),
  });
}

export async function getCapabilities(session: AuthSession) {
  return apiFetch<Capabilities>('/me/capabilities', {
    ...authOptionsFor(session),
  });
}
