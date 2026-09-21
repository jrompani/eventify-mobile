import { Experience } from '../types/experience';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export function hasExperienceCoordinates(experience: Experience) {
  return typeof experience.location?.latPublic === 'number' && typeof experience.location?.lngPublic === 'number';
}

export function experienceCoordinate(experience: Experience): Coordinate | null {
  if (!hasExperienceCoordinates(experience)) {
    return null;
  }
  return {
    latitude: experience.location!.latPublic!,
    longitude: experience.location!.lngPublic!,
  };
}

export function enrichExperiencesWithDistance(experiences: Experience[], userCoordinate: Coordinate | null) {
  if (!userCoordinate) {
    return experiences;
  }

  return experiences
    .map((experience) => {
      const coordinate = experienceCoordinate(experience);
      if (!coordinate) {
        return experience;
      }
      const distanceMeters = distanceBetween(userCoordinate, coordinate);
      return {
        ...experience,
        distance: formatDistance(distanceMeters),
      };
    })
    .sort((left, right) => {
      const leftCoordinate = experienceCoordinate(left);
      const rightCoordinate = experienceCoordinate(right);

      if (!leftCoordinate && !rightCoordinate) {
        return 0;
      }
      if (!leftCoordinate) {
        return 1;
      }
      if (!rightCoordinate) {
        return -1;
      }

      return distanceBetween(userCoordinate, leftCoordinate) - distanceBetween(userCoordinate, rightCoordinate);
    });
}

export function distanceBetween(from: Coordinate, to: Coordinate) {
  const earthRadiusMeters = 6371000;
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.max(50, Math.round(meters / 50) * 50)} m`;
  }
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}
