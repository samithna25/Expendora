import { api } from './api';

export const reportService = {
  /**
   * GET /reports/dashboard
   * Returns comprehensive aggregated metrics for the current (or given) month.
   *  - monthly_total, transaction_count, daily_average
   *  - category_breakdown, top_category, daily_trend
   *  - budget_status (monthly_limit, remaining, percentage_used, is_over_budget)
   *  - alerts (overspending warnings with levels)
   *  - insights (natural-language spending summary)
   */
  async getDashboard(month, budget) {
    const params = {};
    if (month) params.month = month;
    if (budget != null) params.budget = budget;
    const query = new URLSearchParams(params).toString();
    return api.get(`/reports/dashboard${query ? `?${query}` : ''}`);
  },

  async getMonthlyReport(month, year) {
    return api.get(`/reports/summary?month=${month}&year=${year}`);
  },

  async getCategoryBreakdown(startDate, endDate) {
    return api.get(`/reports/summary?start=${startDate}&end=${endDate}`);
  },

  async getSpendingTrend(period = 'monthly') {
    return api.get(`/reports/monthly-trend?period=${period}`);
  },

  async downloadPdf(reportId) {
    return api.get(`/reports/${reportId}/pdf`);
  },
};
