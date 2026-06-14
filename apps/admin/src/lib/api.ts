export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.8688bnb.com/api/v1').replace(/\/$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

let csrfToken: string | null = null;
const DEFAULT_CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

interface ApiFetchOptions extends RequestInit {
  cacheTtlMs?: number;
  skipCache?: boolean;
}

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

export function clearApiCache() {
  cache.clear();
  inflight.clear();
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
  const { cacheTtlMs = DEFAULT_CACHE_TTL_MS, skipCache = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const canUseCache = method === 'GET' && !skipCache && cacheTtlMs > 0 && !endpoint.startsWith('/auth/');
  const cacheKey = `${method}:${url}`;

  if (canUseCache) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const pending = inflight.get(cacheKey);
    if (pending) {
      return pending;
    }
  }

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Accept', 'application/json');

  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const request = fetch(url, {
    ...fetchOptions,
    method,
    headers,
    credentials: 'include',
  })
    .catch((error) => {
      throw new Error(`無法連線到 API (${API_BASE_URL})：${error instanceof Error ? error.message : '連線失敗'}`);
    })
    .then(async (res) => {
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error(data?.error?.message || `API Error: ${res.status}`);
      }

      if (method !== 'GET') {
        clearApiCache();
      } else if (canUseCache) {
        cache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, data });
      }

      return data;
    })
    .finally(() => {
      if (canUseCache) {
        inflight.delete(cacheKey);
      }
    });

  if (canUseCache) {
    inflight.set(cacheKey, request);
  }

  return request;
}
