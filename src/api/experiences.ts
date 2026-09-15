import { apiFetch } from './client';
import { experiences as fallbackExperiences } from '../data/mockExperiences';
import { AuthSession } from '../types/auth';
import { Experience } from '../types/experience';

type ApiExperience = {
  id: string;
  type: 'PROPOSAL' | 'PLAN' | 'EVENT';
  title: string;
  description: string | null;
  status: string;
  startsAt: string;
  capacity: number | null;
  accessPolicy?: {
    entryMode: string;
    verifiedOnly: boolean;
  };
};

type ApiExperiencePage = {
  content: ApiExperience[];
};

export type CreateExperienceInput = {
  type: 'PLAN' | 'EVENT';
  title: string;
  description?: string;
  startsAt: string;
  capacity?: number;
  entryMode: 'OPEN' | 'REQUEST';
  verifiedOnly: boolean;
};

const imagePool = fallbackExperiences.map((experience) => experience.imageUrl);

export async function listExperiences(): Promise<Experience[]> {
  const page = await apiFetch<ApiExperiencePage>('/experiences?page=0&size=20');
  return page.content.map(toExperience);
}

export async function createExperience(session: AuthSession, input: CreateExperienceInput): Promise<Experience> {
  const created = await apiFetch<ApiExperience>('/experiences', {
    method: 'POST',
    basicAuth: { email: session.email, password: session.password },
    body: JSON.stringify({
      type: input.type,
      title: input.title,
      description: input.description,
      visibility: 'PUBLIC',
      startsAt: input.startsAt,
      timezone: 'America/Argentina/Buenos_Aires',
      capacity: input.capacity,
      entryMode: input.entryMode,
      verifiedOnly: input.verifiedOnly,
    }),
  });

  const published = await apiFetch<ApiExperience>(`/experiences/${created.id}`, {
    method: 'PATCH',
    basicAuth: { email: session.email, password: session.password },
    body: JSON.stringify({
      status: 'PUBLISHED',
    }),
  });

  return toExperience(published, 0);
}

function toExperience(apiExperience: ApiExperience, index: number): Experience {
  const date = new Date(apiExperience.startsAt);
  const fallback = fallbackExperiences[index % fallbackExperiences.length];
  const kind = apiExperience.type === 'EVENT' ? 'Evento' : apiExperience.type === 'PLAN' ? 'Plan' : 'Propuesta';
  const price = kind === 'Evento' ? 'Ver acceso' : 'Gratis';

  return {
    id: apiExperience.id,
    title: apiExperience.title,
    kind,
    time: formatDate(date),
    place: fallback.place,
    price,
    status: ctaFor(apiExperience),
    attendees: apiExperience.capacity ?? fallback.attendees,
    distance: fallback.distance,
    trustLabel: apiExperience.accessPolicy?.verifiedOnly ? 'Verificado' : fallback.trustLabel,
    imageUrl: imagePool[index % imagePool.length],
    tags: [kind, apiExperience.status, apiExperience.accessPolicy?.entryMode ?? 'OPEN'],
  };
}

function formatDate(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return 'Fecha a confirmar';
  }
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ctaFor(experience: ApiExperience) {
  if (experience.type === 'PLAN') {
    return experience.accessPolicy?.entryMode === 'REQUEST' ? 'Solicitar unirme' : 'Me sumo';
  }
  if (experience.accessPolicy?.entryMode === 'REQUEST') {
    return 'Solicitar asistir';
  }
  return 'Ver detalle';
}
