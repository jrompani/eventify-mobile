import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type ReportTargetType = 'USER' | 'EXPERIENCE' | 'GROUP' | 'MESSAGE';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'SAFETY_RISK' | 'FRAUD' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | string;
export type UserBlockStatus = 'ACTIVE' | 'REMOVED';

export type BlockResponse = {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  blockedUserEmail: string;
  status: UserBlockStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReportResponse = {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

export async function listMyBlocks(session: AuthSession) {
  return apiFetch<BlockResponse[]>('/me/blocks', {
    ...authOptionsFor(session),
  });
}

export async function blockUser(session: AuthSession, userId: string) {
  return apiFetch<BlockResponse>(`/me/blocks/${userId}`, {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export async function unblockUser(session: AuthSession, userId: string) {
  return apiFetch<BlockResponse>(`/me/blocks/${userId}`, {
    method: 'DELETE',
    ...authOptionsFor(session),
  });
}

export async function createReport(
  session: AuthSession,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  description?: string
) {
  return apiFetch<ReportResponse>('/reports', {
    method: 'POST',
    ...authOptionsFor(session),
    body: JSON.stringify({
      targetType,
      targetId,
      reason,
      description: description?.trim() || undefined,
    }),
  });
}
