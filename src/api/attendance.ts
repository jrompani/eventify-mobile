import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type AttendanceRecord = {
  id: string;
  experienceId: string;
  experienceTitle: string;
  experienceType: 'PROPOSAL' | 'PLAN' | 'EVENT';
  registrationId: string;
  checkInId: string | null;
  status: 'ATTENDED' | 'NO_SHOW';
  evidenceType: 'CHECK_IN';
  evidenceStrength: number;
  recordedAt: string;
};

export async function listMyAttendance(session: AuthSession) {
  return apiFetch<AttendanceRecord[]>('/me/attendance', {
    ...authOptionsFor(session),
  });
}
