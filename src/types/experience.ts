export type ExperienceKind = 'Plan' | 'Evento' | 'Propuesta';

export type ExperienceLocation = {
  id?: string;
  label: string;
  addressPublic: string;
  latPublic: number | null;
  lngPublic: number | null;
};

export type OrganizerSummary = {
  userId: string;
  displayName: string;
  username: string | null;
  publicZone: string | null;
  avatarUrl: string | null;
};

export type ViewerRegistration = {
  registrationId: string | null;
  status: string | null;
  registered: boolean;
  primaryAction: string | null;
};

export type Experience = {
  id: string;
  ownerUserId?: string;
  organizer?: OrganizerSummary;
  title: string;
  kind: ExperienceKind;
  time: string;
  place: string;
  price: string;
  status: string;
  viewerRegistration?: ViewerRegistration | null;
  viewerRegistrationStatus?: string | null;
  attendees: number;
  distance: string;
  trustLabel: string;
  imageUrl: string;
  tags: string[];
  entryMode?: string;
  verifiedOnly?: boolean;
  ageMin?: number | null;
  location?: ExperienceLocation;
};

