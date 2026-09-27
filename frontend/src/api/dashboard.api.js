import api from './client.js';

export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
  getFilteredProfit: async (params) => {
    const res = await api.get('/dashboard/profit-filter', { params });
    return res.data;
  },
  getExpiringDocs: async () => {
    const res = await api.get('/dashboard/expiring-documents');
    return res.data;
  }
};
