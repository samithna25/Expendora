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
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response;
  },

  async uploadProfilePicture(uri) {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    formData.append('file', {
      uri,
      name: filename,
      type,
    });
    
    const response = await api.upload('/auth/profile/picture', formData);
    return response.data;
  },
};

