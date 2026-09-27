import api from './client.js';

export const suppliersApi = {
  list: async (params = {}) => {
    const res = await api.get('/suppliers', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/suppliers', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/suppliers/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  }
};
