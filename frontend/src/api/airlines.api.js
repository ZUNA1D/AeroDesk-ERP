import api from './client.js';

export const airlinesApi = {
  list: async () => {
    const res = await api.get('/airlines');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/airlines', data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/airlines/${id}`);
    return res.data;
  }
};
