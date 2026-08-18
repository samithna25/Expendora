import { api } from './api';

/**
 * expenseService
 *
 * All expense-related API calls. Delegates to api.js which handles
 * JWT auth (Bearer token from AsyncStorage), 15-second timeout, and
 * error normalisation.
 *
 * Backend base-routes (all require Authorization header):
 *   GET    /expenses                 – list all (supports ?category=, ?start=, ?end=)
 *   POST   /expenses                 – create
 *   GET    /expenses/:id             – single
 *   PUT    /expenses/:id             – update
 *   DELETE /expenses/:id             – delete
 *   GET    /expenses/by-category     – grouped totals
 *   GET    /expenses/monthly-trend   – month-over-month array
 */
export const expenseService = {
  /**
   * Fetch all expenses for the current user.
   * @param {object} params - Optional query params (category, start, end, limit, skip)
   */
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return api.get(`/expenses${query ? `?${query}` : ''}`);
  },

  /** Fetch a single expense by id. */
  async getById(id) {
    return api.get(`/expenses/${id}`);
  },

  /**
   * Create a new expense.
   * @param {object} expense - { merchant, amount, category, date, method, notes?, image_url? }
   */
  async create(expense) {
    return api.post('/expenses', expense);
  },

  /**
   * Update an existing expense.
   * @param {string} id
   * @param {object} expense - Partial or full expense object
   */
  async update(id, expense) {
    return api.put(`/expenses/${id}`, expense);
  },

  /** Delete an expense by id. */
  async delete(id) {
    return api.delete(`/expenses/${id}`);
  },

  /**
   * Get spending totals grouped by category for the current month.
   * Returns: [{ category, total }]
   */
  async getByCategory() {
    return api.get('/expenses/by-category');
  },

  /**
   * Get month-over-month spending trend.
   * Returns: [{ month, total }]
   */
  async getMonthlyTrend() {
    return api.get('/expenses/monthly-trend');
  },

  /**
   * Convenience helper — returns a summary object for the current month.
   * Derived client-side from getAll() to avoid needing a separate endpoint.
   *
   * Returns: { totalSpent, count }
   */
  async getSummary() {
    const response = await expenseService.getAll();
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
      ? response.data
      : (response?.data?.expenses ?? []);
    const totalSpent = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { totalSpent, count: list.length };
  },

  /**
   * Get per-category spending for BudgetPlanner, derived from the live expense list.
   * Returns: { [categoryId]: number }
   */
  async getBudgetSpending() {
    const response = await expenseService.getAll();
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
      ? response.data
      : (response?.data?.expenses ?? []);
    return list.reduce((acc, e) => {
      const cat = (e.category || 'other').toLowerCase();
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
  },
};
