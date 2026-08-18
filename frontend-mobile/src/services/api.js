import { API_BASE_URL } from '../utils/constants';
import { tokenStorage } from './tokenStorage';

let _onSessionExpired = null;
let _refreshPromise = null;

export function setOnSessionExpiredHandler(handler) {
  _onSessionExpired = handler;
}

/**
 * Exchange the stored refresh token for fresh access + refresh tokens.
 * Single-flight: concurrent 401s share the same in-flight refresh.
 * Only clears the session (and notifies the app) when the server confirms
 * the session is truly gone (401), never on transient network errors.
 */
async function doRefresh() {
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) {
    await tokenStorage.clearAll();
    _onSessionExpired?.();
    throw new Error('Session expired. Please log in again.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      await tokenStorage.clearAll();
      _onSessionExpired?.();
    }
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  const { token, refreshToken: newRefreshToken } = body.data || {};
  await tokenStorage.setAccessToken(token);
  await tokenStorage.setRefreshToken(newRefreshToken);
  return token;
}

function refreshTokens() {
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}, _isRetry = false) {
    const token = await tokenStorage.getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        const msg = error.message || `Request failed with status ${response.status}`;

        if (response.status === 401) {
          const isHardExpiry = msg.toLowerCase().includes('session expired');

          // Backend explicitly rejected the session (expired / logged out elsewhere).
          if (isHardExpiry) {
            if (_onSessionExpired) _onSessionExpired();
            throw new Error(msg);
          }

          // Access token expired → try a silent refresh and retry once.
          if (!_isRetry) {
            try {
              await refreshTokens();
              return this.request(endpoint, options, true);
            } catch (refreshErr) {
              throw refreshErr;
            }
          }
        }

        throw new Error(msg);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Check that the backend is running and the IP is correct.');
      }
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint, formData) {
    const token = await tokenStorage.getAccessToken();
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        const msg = error.message || 'Upload failed';

        if (response.status === 401 && !msg.toLowerCase().includes('session expired')) {
          try {
            await refreshTokens();
            return this.upload(endpoint, formData);
          } catch (refreshErr) {
            throw refreshErr;
          }
        }

        if (response.status === 401 && msg.toLowerCase().includes('session expired')) {
          if (_onSessionExpired) _onSessionExpired();
        }

        throw new Error(msg);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Check that the backend is running and the IP is correct.');
      }
      throw err;
    }
  }
}

export const api = new ApiClient();
