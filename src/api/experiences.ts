import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { experiences as fallbackExperiences } from '../data/mockExperiences';
import { AuthSession } from '../types/auth';
import { Experience, ExperienceLocation } from '../types/experience';

type ApiExperience = {
  id: string;
  type: 'PROPOSAL' | 'PLAN' | 'EVENT';
  ownerUserId?: string;
  title: string;
  description: string | null;
  status: string;
  startsAt: string;
  capacity: number | null;
  publicLocation: ApiLocation | null;
  accessPolicy?: {
    entryMode: string;
    verifiedOnly: boolean;
  };
};

type ApiLocation = {
  id: string;
  label: string | null;
  addressPublic: string | null;
  latPublic: number | null;
  lngPublic: number | null;
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
  publicLocation?: {
    label?: string;
    addressPublic?: string;
    latPublic?: number;
    lngPublic?: number;
  };
};

const imagePool = fallbackExperiences.map((experience) => experience.imageUrl);

export async function listExperiences(): Promise<Experience[]> {
  const page = await apiFetch<ApiExperiencePage>('/experiences?page=0&size=20');
  return page.content.map(toExperience);
}

export async function createExperience(session: AuthSession, input: CreateExperienceInput): Promise<Experience> {
  const created = await apiFetch<ApiExperience>('/experiences', {
    method: 'POST',
    ...authOptionsFor(session),
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
      publicLocation: input.publicLocation,
    }),
  });

  const published = await apiFetch<ApiExperience>(`/experiences/${created.id}`, {
    method: 'PATCH',
    ...authOptionsFor(session),
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
    ownerUserId: apiExperience.ownerUserId,
    title: apiExperience.title,
    kind,
    time: formatDate(date),
    place: apiExperience.publicLocation?.label || apiExperience.publicLocation?.addressPublic || fallback.place,
    price,
    status: ctaFor(apiExperience),
    attendees: apiExperience.capacity ?? fallback.attendees,
    distance: fallback.distance,
    trustLabel: apiExperience.accessPolicy?.verifiedOnly ? 'Verificado' : fallback.trustLabel,
    imageUrl: imagePool[index % imagePool.length],
    tags: [kind, apiExperience.status, apiExperience.accessPolicy?.entryMode ?? 'OPEN'],
    location: toLocation(apiExperience.publicLocation, fallback.location),
  };
}

function toLocation(apiLocation: ApiLocation | null, fallback?: ExperienceLocation): ExperienceLocation | undefined {
  if (!apiLocation) {
    return fallback;
  }

  return {
    id: apiLocation.id,
    label: apiLocation.label || apiLocation.addressPublic || fallback?.label || 'Ubicacion',
    addressPublic: apiLocation.addressPublic || apiLocation.label || fallback?.addressPublic || 'Ubicacion publica',
    latPublic: apiLocation.latPublic,
    lngPublic: apiLocation.lngPublic,
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
