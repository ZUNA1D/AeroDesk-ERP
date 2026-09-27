import api from './client.js';

export const clientsApi = {
  list: async (params = {}) => {
    const res = await api.get('/clients', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/clients/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/clients', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/clients/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/clients/${id}`);
    return res.data;
  },
  uploadDoc: async (id, formData) => {
    const res = await api.post(`/clients/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
