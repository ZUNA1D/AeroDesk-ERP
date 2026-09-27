import api from './client.js';

export const maintenanceApi = {
  recalculateBalances: async () => {
    const res = await api.post('/maintenance/recalculate-balances');
    return res.data;
  }
};
