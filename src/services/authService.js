import { api } from './api';

export const authService = {
  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  async register(name, email, password) {
    return api.post('/auth/register', { name, email, password });
  },

  async getProfile(token) {
    return api.get('/auth/profile');
  },

  async updateProfile(data) {
    return api.put('/auth/profile', data);
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, password) {
    return api.post('/auth/reset-password', { token, password });
  },
};
