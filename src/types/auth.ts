export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';

export type UserProfile = {
  displayName: string;
  username: string | null;
  bio: string | null;
  publicZone: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  birthYear: number | null;
  gender: 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  interests: string[];
};

export type User = {
  id: string;
  email: string;
  status: UserStatus;
  profile: UserProfile;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  accessTokenExpiresAt: string;
};

export type AuthSession = {
  email: string;
  password?: string;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  user: User;
};
