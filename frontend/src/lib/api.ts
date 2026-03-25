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

function getStoredAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem('companyos-auth');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const accessToken = getStoredAccessToken();

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
    headers,
  });
}
