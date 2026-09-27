import api from './client.js';

export const reportsApi = {
  getClientStatement: async (params) => {
    const res = await api.get('/reports/client-statement', { params });
    return res.data;
  },
  getSupplierStatement: async (params) => {
    const res = await api.get('/reports/supplier-statement', { params });
    return res.data;
  },
  getTicketProfit: async (params) => {
    const res = await api.get('/reports/profit-ticket', { params });
    return res.data;
  },
  getVisaProfit: async (params) => {
    const res = await api.get('/reports/profit-visa', { params });
    return res.data;
  },
  getAgingReport: async () => {
    const res = await api.get('/reports/client-aging');
    return res.data;
  }
};
