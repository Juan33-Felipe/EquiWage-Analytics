/**
 * Base HTTP client for communicating with the local EquiWage Analytics Backend Server.
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4000';

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
