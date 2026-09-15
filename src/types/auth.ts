export type UserStatus = 'ACTIVE' | 'DISABLED';

export type UserProfile = {
  displayName: string;
  username: string | null;
  bio: string | null;
  publicZone: string | null;
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
};

export type AuthSession = {
  email: string;
  password: string;
  user: User;
};
