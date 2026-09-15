export type ExperienceKind = 'Plan' | 'Evento' | 'Propuesta';

export type Experience = {
  id: string;
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
};
