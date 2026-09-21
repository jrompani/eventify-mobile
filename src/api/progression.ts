import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type XpLedgerEntry = {
  id: string;
  entryType: 'GRANT' | 'REVERSAL';
  sourceType: 'ATTENDANCE';
  sourceId: string;
  points: number;
  reason: string;
  createdAt: string;
};

export type XpSummary = {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  recentEntries: XpLedgerEntry[];
};

export async function getProgression(session: AuthSession) {
  return apiFetch<XpSummary>('/me/progression', {
    ...authOptionsFor(session),
  });
}
