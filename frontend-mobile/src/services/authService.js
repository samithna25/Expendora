import { api } from './api';

async function tryOrMock(fn, mockData) {
  try {
    return await fn();
  } catch {
    return mockData;
  }
}

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async getProfile(token) {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async checkSession() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data) {
    return tryOrMock(() => api.put('/auth/profile', data), data);
  },

  async forgotPassword(email) {
    return tryOrMock(() => api.post('/auth/forgot-password', { email }), { ok: true });
  },

  async resetPassword(token, password) {
    return tryOrMock(() => api.post('/auth/reset-password', { token, password }), { ok: true });
  },
};
