export type ExperienceKind = 'Plan' | 'Evento' | 'Propuesta';

export type ExperienceLocation = {
  id?: string;
  label: string;
  addressPublic: string;
  latPublic: number | null;
  lngPublic: number | null;
};

export type Experience = {
  id: string;
  ownerUserId?: string;
  title: string;
  kind: ExperienceKind;
  time: string;
  place: string;
  price: string;
  status: string;
  attendees: number;
  distance: string;
  trustLabel: string;
  imageUrl: string;
  tags: string[];
  location?: ExperienceLocation;
};
