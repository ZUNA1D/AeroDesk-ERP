import api from './client.js';

export const settingsApi = {
  get: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  update: async (formData) => {
    const res = await api.patch('/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
