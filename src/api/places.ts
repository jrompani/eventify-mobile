import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { Coordinate } from '../location/distance';
import { AuthSession } from '../types/auth';

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
};

type PlaceSearchResponse = {
  results: PlaceResult[];
};

type PlaceGeocodeResponse = {
  result: PlaceResult | null;
};

export async function searchPlaces(session: AuthSession, query: string, coordinate: Coordinate | null) {
  const params = new URLSearchParams({ query });
  if (coordinate) {
    params.set('latitude', `${coordinate.latitude}`);
    params.set('longitude', `${coordinate.longitude}`);
  }

  const response = await apiFetch<PlaceSearchResponse>(`/places/search?${params.toString()}`, {
    ...authOptionsFor(session),
    timeoutMs: 10000,
  });
  return response.results;
}

export async function geocodeAddress(session: AuthSession, address: string) {
  const params = new URLSearchParams({ address });
  const response = await apiFetch<PlaceGeocodeResponse>(`/places/geocode?${params.toString()}`, {
    ...authOptionsFor(session),
    timeoutMs: 10000,
  });
  return response.result;
}

export async function reverseGeocodeCoordinate(session: AuthSession, coordinate: Coordinate) {
  const params = new URLSearchParams({
    latitude: `${coordinate.latitude}`,
    longitude: `${coordinate.longitude}`,
  });
  const response = await apiFetch<PlaceGeocodeResponse>(`/places/reverse-geocode?${params.toString()}`, {
    ...authOptionsFor(session),
    timeoutMs: 10000,
  });
  return response.result;
}
