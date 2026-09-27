import api from './client.js';

export const usersApi = {
  list: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle-status`);
    return res.data;
  }
};
