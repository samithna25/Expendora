import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

let _onSessionExpired = null;

export function setOnSessionExpiredHandler(handler) {
  _onSessionExpired = handler;
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
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
        if (response.status === 401 && msg.toLowerCase().includes('session expired') && _onSessionExpired) {
          _onSessionExpired();
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
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      const msg = error.message || 'Upload failed';
      if (response.status === 401 && msg.toLowerCase().includes('session expired') && _onSessionExpired) {
        _onSessionExpired();
      }
      throw new Error(msg);
    }

    return response.json();
  }
}

export const api = new ApiClient();
