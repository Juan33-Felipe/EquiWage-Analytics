/**
 * Base HTTP client for communicating with the local EquiWage Analytics Backend Server.
 * Automatically attaches the local JWT Bearer token and signals 401 session expiration.
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000';

export const AUTH_TOKEN_STORAGE_KEY = 'equiwage_auth_token';
export const AUTH_USER_STORAGE_KEY = 'equiwage_auth_user';
export const AUTH_UNAUTHORIZED_EVENT = 'equiwage:unauthorized';

export function getStoredAuthToken() {
  try {
    return (
      localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

export function setStoredAuthSession({ token, user, rememberMe = true }) {
  try {
    const primaryStorage = rememberMe ? localStorage : sessionStorage;
    const secondaryStorage = rememberMe ? sessionStorage : localStorage;

    secondaryStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    secondaryStorage.removeItem(AUTH_USER_STORAGE_KEY);

    if (token) {
      primaryStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
    if (user) {
      primaryStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

export function getStoredAuthUser() {
  try {
    const raw =
      localStorage.getItem(AUTH_USER_STORAGE_KEY) ||
      sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuthSession() {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export class ApiClientError extends Error {
  constructor(message, { status = 500, errorKey = 'error.badRequest', missingColumns = [], details = [] } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errorKey = errorKey;
    this.missingColumns = missingColumns;
    this.details = details;
  }
}

export function resolveApiUrl(endpoint) {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = DEFAULT_API_BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export async function apiRequest(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }
  }

  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new ApiClientError('Failed to download report file from backend.', {
        status: response.status,
      });
    }
    return response.blob();
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || (json && json.ok === false)) {
    throw new ApiClientError(
      json?.message || `Backend request failed (${response.status})`,
      {
        status: response.status,
        errorKey: json?.errorKey || 'error.badRequest',
        missingColumns: json?.missingColumns || [],
        details: json?.details || [],
      }
    );
  }

  return json?.data !== undefined ? json.data : json;
}
