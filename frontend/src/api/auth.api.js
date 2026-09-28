import api from './client.js';

export const authApi = {
  checkStatus: async () => {
    const res = await api.get('/auth/status');
    return res.data;
  },
  setup: async (data) => {
    const res = await api.post('/auth/setup', data);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  registerAgency: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  }
};
