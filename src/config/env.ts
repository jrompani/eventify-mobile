const fallbackApiBaseUrl = 'http://localhost:8080/api/v1';

export const API_BASE_URL = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL ?? fallbackApiBaseUrl);
export const GOOGLE_WEB_CLIENT_ID = normalizeOptional(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
export const GOOGLE_IOS_CLIENT_ID = normalizeOptional(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
export const FACEBOOK_CLIENT_ID = normalizeOptional(process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_ID);

function normalizeApiBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/, '');

  if (!normalized) {
    return fallbackApiBaseUrl;
  }

  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return fallbackApiBaseUrl;
    }
    return normalized;
  } catch {
    return fallbackApiBaseUrl;
  }
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
