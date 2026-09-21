import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type ReputationSummary = {
  attendedCount: number;
  noShowCount: number;
  totalXp: number;
  reputationScore: number;
  reputationBand: 'TRUSTED' | 'POSITIVE' | 'NEW_OR_MIXED' | 'NEEDS_REVIEW' | string;
};

export async function getReputation(session: AuthSession) {
  return apiFetch<ReputationSummary>('/me/reputation', {
    ...authOptionsFor(session),
  });
}
