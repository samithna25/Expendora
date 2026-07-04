import { api } from './api';

export const reportService = {
  async getMonthlyReport(month, year) {
    return api.get(`/reports/monthly?month=${month}&year=${year}`);
  },

  async getCategoryBreakdown(startDate, endDate) {
    return api.get(`/reports/categories?start=${startDate}&end=${endDate}`);
  },

  async getSpendingTrend(period = 'monthly') {
    return api.get(`/reports/trend?period=${period}`);
  },

  async downloadPdf(reportId) {
    return api.get(`/reports/${reportId}/pdf`);
  },
};
