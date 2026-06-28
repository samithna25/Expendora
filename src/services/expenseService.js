import { api } from './api';

export const expenseService = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/expenses${query ? `?${query}` : ''}`);
  },

  async getById(id) {
    return api.get(`/expenses/${id}`);
  },

  async create(expense) {
    return api.post('/expenses', expense);
  },

  async update(id, expense) {
    return api.put(`/expenses/${id}`, expense);
  },

  async delete(id) {
    return api.delete(`/expenses/${id}`);
  },

  async getByCategory() {
    return api.get('/expenses/by-category');
  },

  async getMonthlyTrend() {
    return api.get('/expenses/monthly-trend');
  },
};
