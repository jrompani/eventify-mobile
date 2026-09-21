import { API_BASE_URL } from '../config/env';

type ApiOptions = RequestInit & {
  basicAuth?: {
    email: string;
    password: string;
  };
  bearerToken?: string;
  timeoutMs?: number;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.bearerToken) {
    headers.set('Authorization', `Bearer ${options.bearerToken}`);
  } else if (options.basicAuth) {
    const token = encodeBase64(`${options.basicAuth.email}:${options.basicAuth.password}`);
    headers.set('Authorization', `Basic ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 15000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch (exception) {
    if (exception instanceof Error && exception.name === 'AbortError') {
      throw new Error('La conexion tardo demasiado. Revisa tu red e intenta de nuevo.');
    }
    throw new Error('No se pudo conectar con el servidor.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get('Content-Type') ?? '';
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  if (!contentType.includes('application/json')) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string; detail?: string };
    return parsed.message ?? parsed.detail ?? parsed.error ?? raw;
  } catch {
    return raw;
  }
}

function encodeBase64(value: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const bytes = unescape(encodeURIComponent(value));
  let output = '';
  let index = 0;

  while (index < bytes.length) {
    const chr1 = bytes.charCodeAt(index++);
    const chr2 = bytes.charCodeAt(index++);
    const chr3 = bytes.charCodeAt(index++);

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;

    if (Number.isNaN(chr2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(chr3)) {
      enc4 = 64;
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
}
