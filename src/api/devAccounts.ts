import { login, register, updateProfile } from './auth';
import { AuthSession } from '../types/auth';

const DEV_PASSWORD = 'Passw0rd!';

const devAccounts = {
  owner: {
    email: 'owner.local@eventify.dev',
    displayName: 'Owner Local',
    username: 'owner_local',
    publicZone: 'MVP local',
    interests: ['Networking', 'Fiesta'],
  },
  attendee: {
    email: 'attendee.local@eventify.dev',
    displayName: 'Attendee Local',
    username: 'attendee_local',
    publicZone: 'MVP local',
    interests: ['Electronica', 'Rooftops'],
  },
};

export type DevAccountKind = keyof typeof devAccounts;

export async function openDevAccount(kind: DevAccountKind): Promise<AuthSession> {
  const account = devAccounts[kind];
  let user;
  let accessToken: string;

  try {
    const response = await register({
      email: account.email,
      password: DEV_PASSWORD,
      displayName: account.displayName,
      username: account.username,
    });
    user = response.user;
    accessToken = response.accessToken;
  } catch {
    const response = await login({
      email: account.email,
      password: DEV_PASSWORD,
    });
    user = response.user;
    accessToken = response.accessToken;
  }

  const session: AuthSession = {
    email: account.email,
    password: DEV_PASSWORD,
    accessToken,
    user,
  };

  const updatedUser = await updateProfile(
    session,
    {
      displayName: account.displayName,
      username: account.username,
      publicZone: account.publicZone,
      birthYear: kind === 'owner' ? 1995 : 1999,
      interests: account.interests,
    }
  );

  return {
    email: account.email,
    password: DEV_PASSWORD,
    accessToken,
    user: updatedUser,
  };
}
