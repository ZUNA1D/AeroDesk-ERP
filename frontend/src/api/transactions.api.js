import api from './client.js';

export const transactionsApi = {
  list: async (params = {}) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
  createTicket: async (data) => {
    const res = await api.post('/transactions/ticket-invoice', data);
    return res.data;
  },
  createVisa: async (data) => {
    const res = await api.post('/transactions/visa-invoice', data);
    return res.data;
  },
  createReceipt: async (data) => {
    const res = await api.post('/transactions/client-receipt', data);
    return res.data;
  },
  createSupplierTxn: async (data) => {
    const res = await api.post('/transactions/supplier-txn', data);
    return res.data;
  },
  createExpense: async (data) => {
    const res = await api.post('/transactions/expense', data);
    return res.data;
  },
  createRefund: async (data) => {
    const res = await api.post('/transactions/refund', data);
    return res.data;
  },
  edit: async (id, data) => {
    const res = await api.patch(`/transactions/${id}`, data);
    return res.data;
  },
  void: async (id, reason) => {
    const res = await api.post(`/transactions/${id}/void`, { reason });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  }
};
