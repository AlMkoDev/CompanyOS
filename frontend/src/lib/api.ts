function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL must be set before starting the frontend.',
    );
  }

  return apiBaseUrl.replace(/\/+$/, '');
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '';

export function apiUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });
}
