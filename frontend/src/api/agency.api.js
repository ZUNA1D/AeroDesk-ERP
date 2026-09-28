import api from './client.js';

export const agencyApi = {
  getProfile: async () => {
    const res = await api.get('/agency/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/agency/profile', data);
    return res.data;
  },
  // Platform Super Admin
  getAllAgencies: async () => {
    const res = await api.get('/agency/all');
    return res.data;
  },
  updateAgencyStatus: async (id, data) => {
    const res = await api.patch(`/agency/${id}/status`, data);
    return res.data;
  }
};
