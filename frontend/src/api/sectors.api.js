import api from './client.js';

export const sectorsApi = {
  list: async () => {
    const res = await api.get('/sectors');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/sectors', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/sectors/${id}`);
    return res.data;
  }
};
