import api from './client.js';

export const auditApi = {
  list: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  }
};
