import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions.api.js';
import { clientsApi } from '../api/clients.api.js';
import { suppliersApi } from '../api/suppliers.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import {
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Printer,
  Edit2,
  Ban,
  Trash2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

export function LedgerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Filters state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [clientId, setClientId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Selected row expansion state
  const [expandedRows, setExpandedRows] = useState({});

  // Modals state
  const [voidTx, setVoidTx] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [deleteTx, setDeleteTx] = useState(null);
  const [editTx, setEditTx] = useState(null);

  // Fetch transactions query
  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', search, type, status, clientId, supplierId, from, to, page],
    queryFn: () => transactionsApi.list({
      search,
      type,
      status: status || undefined,
      clientId,
      supplierId,
      from,
      to,
      page,
      limit
    }),
    keepPreviousData: true
  });

  // Fetch clients & suppliers for filter dropdowns
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list({ limit: 500 })
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list()
  });

  const clients = clientsData?.clients || [];
  const suppliers = suppliersData?.suppliers || [];
  const transactions = txData?.transactions || [];
  const pagination = txData?.pagination || { total: 0, page: 1, pages: 1 };

  // Void Mutation
  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) => transactionsApi.void(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setVoidTx(null);
      setVoidReason('');
    }
  });

  // Hard Delete Mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: (id) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTx(null);
    }
  });

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintReceipt = (id) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/transactions/${id}/receipt-pdf`;
    window.open(url, '_blank');
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['Ref', 'Date', 'Type', 'Status', 'Client', 'Supplier', 'Amount/Sell', 'Cost/Buy', 'Profit', 'Remarks'];
    const csvRows = [headers.join(',')];

    for (const tx of transactions) {
      const row = [
        tx.ref,
        new Date(tx.date).toLocaleDateString('en-GB'),
        tx.type,
        tx.status,
        `"${tx.client?.name || ''}"`,
        `"${tx.supplier?.name || ''}"`,
        tx.totalSell || tx.amount || 0,
        tx.totalBuy || 0,
        tx.profit || 0,
        `"${(tx.remarks || tx.voidReason || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            General Ledger
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            All ticket sales, visa invoices, client receipts, supplier top-ups, and expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={FileSpreadsheet} onClick={handleExportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search Ref, Pax, PNR, Ticket..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="input-base pl-9 text-xs"
              />
            </div>

            {/* Type Filter */}
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="input-base text-xs cursor-pointer"
            >
              <option value="">All Transaction Types</option>
              <option value="TICKET_INVOICE">Air Ticket Invoices</option>
              <option value="VISA_INVOICE">Visa Invoices</option>
              <option value="CLIENT_RECEIPT">Client Money Receipts</option>
              <option value="SUPPLIER_DEPOSIT">Supplier Portal Deposits</option>
              <option value="SUPPLIER_PAYMENT">Supplier Agency Payments</option>
              <option value="SUPPLIER_DEBIT_MEMO">ADM (Debit Memos)</option>
              <option value="SUPPLIER_CREDIT_MEMO">ACM (Credit Memos)</option>
              <option value="REFUND">Refunds & Reissues</option>
              <option value="EXPENSE">Office Expenses</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="input-base text-xs cursor-pointer"
            >
              <option value="">All Statuses (Active + Voided)</option>
              <option value="ACTIVE">Active Transactions Only</option>
              <option value="VOIDED">Voided Transactions Only</option>
            </select>

            {/* Client Filter */}
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setPage(1); }}
              className="input-base text-xs cursor-pointer"
            >
              <option value="">All Clients</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Supplier Filter */}
            <select
              value={supplierId}
              onChange={(e) => { setSupplierId(e.target.value); setPage(1); }}
              className="input-base text-xs cursor-pointer"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.type})</option>
              ))}
            </select>

            {/* Date From */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>From:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                className="input-base text-xs flex-1"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>To:</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                className="input-base text-xs flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <div
        className="overflow-x-auto rounded-xl border"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <table className="w-full text-left text-xs">
          <thead
            className="uppercase tracking-wider text-[11px] border-b"
            style={{
              backgroundColor: 'var(--table-header-bg)',
              color: 'var(--text-tertiary)',
              borderColor: 'var(--border)',
            }}
          >
            <tr>
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Ref No</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Party (Client / Supplier)</th>
              <th className="py-3 px-3 text-right">Debit / Sell</th>
              <th className="py-3 px-3 text-right">Credit / Cost</th>
              <th className="py-3 px-3 text-right">Net Profit</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Loading ledger transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  No ledger records match the selected filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const isExpanded = Boolean(expandedRows[tx._id]);
                const isVoided = tx.status === 'VOIDED';

                return (
                  <React.Fragment key={tx._id}>
                    <tr
                      className="transition-colors"
                      style={{
                        backgroundColor: isVoided ? 'var(--danger-muted)' : undefined,
                        opacity: isVoided ? 0.65 : 1,
                      }}
                      onMouseEnter={(e) => { if (!isVoided) e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'; }}
                      onMouseLeave={(e) => { if (!isVoided) e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <td className="py-3 px-3 text-center">
                        {(tx.passengers?.length > 0 || tx.remarks || tx.voidReason) && (
                          <button
                            onClick={() => toggleRow(tx._id)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(tx.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                        {tx.ref}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            isVoided ? 'voided' :
                            tx.type === 'TICKET_INVOICE' ? 'primary' :
                            tx.type === 'VISA_INVOICE' ? 'purple' :
                            tx.type === 'CLIENT_RECEIPT' ? 'success' :
                            tx.type === 'SUPPLIER_DEPOSIT' ? 'portal' :
                            tx.type === 'SUPPLIER_PAYMENT' ? 'agency' : 'neutral'
                          }
                          size="xs"
                        >
                          {tx.type.replace('_INVOICE', '').replace('CLIENT_', '').replace('SUPPLIER_', '')}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {tx.client?.name || tx.supplier?.name || 'Office Expense'}
                        </div>
                        {tx.passengers?.length > 0 && (
                          <div className="text-[10px] truncate max-w-[200px]" style={{ color: 'var(--text-tertiary)' }}>
                            {tx.passengers.length} Pax: {tx.passengers.map(p => p.name).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold" style={{ color: 'var(--success)' }}>
                        {tx.totalSell ? formatMoney(tx.totalSell) : tx.type === 'CLIENT_RECEIPT' ? '-' : formatMoney(tx.amount || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {tx.totalBuy ? formatMoney(tx.totalBuy) : tx.type === 'CLIENT_RECEIPT' ? formatMoney(tx.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {tx.profit !== undefined ? (
                          <span style={{ color: tx.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {formatMoney(tx.profit)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isVoided ? 'voided' : 'active'} size="xs">
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {tx.type === 'CLIENT_RECEIPT' && (
                            <button
                              onClick={() => handlePrintReceipt(tx._id)}
                              title="Print Money Receipt Voucher"
                              className="p-1.5 rounded-md transition-colors hover:bg-[var(--surface-secondary)]"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isVoided && (
                            <button
                              onClick={() => setVoidTx(tx)}
                              title="Void Transaction"
                              className="p-1.5 rounded-md transition-colors hover:bg-[var(--warning-muted)]"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => setDeleteTx(tx)}
                              title="Hard Delete (Admin Only)"
                              className="p-1.5 rounded-md transition-colors hover:bg-[var(--danger-muted)]"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Passenger & Details Sub-row */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan="10"
                          className="p-4 border-y text-xs"
                          style={{
                            backgroundColor: 'var(--surface-secondary)',
                            borderColor: 'var(--border)',
                          }}
                        >
                          <div className="space-y-3 pl-6">
                            {isVoided && (
                              <div
                                className="p-2.5 rounded-lg text-xs flex items-center gap-2 border"
                                style={{
                                  backgroundColor: 'var(--danger-muted)',
                                  borderColor: 'rgba(239, 68, 68, 0.2)',
                                  color: 'var(--danger)',
                                }}
                              >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <div>
                                  <strong>Void Reason:</strong> {tx.voidReason || 'Not specified'}
                                  {tx.voidedBy?.name && ` • Voided by ${tx.voidedBy.name}`}
                                  {tx.voidedAt && ` on ${new Date(tx.voidedAt).toLocaleString()}`}
                                </div>
                              </div>
                            )}

                            {tx.passengers?.length > 0 && (
                              <div>
                                <h5
                                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  Passenger Breakdown
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {tx.passengers.map((p, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="p-2.5 rounded-lg border"
                                      style={{
                                        backgroundColor: 'var(--surface)',
                                        borderColor: 'var(--border)',
                                      }}
                                    >
                                      <div className="font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
                                        {p.name}
                                      </div>
                                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                        {p.ticketNo && <span>Tkt: {p.ticketNo} • </span>}
                                        {p.pnr && <span>PNR: {p.pnr} • </span>}
                                        {p.route && <span>Route: {p.route} • </span>}
                                        {p.visaNo && <span>Visa: {p.visaNo}</span>}
                                      </div>
                                      <div
                                        className="flex justify-between text-[11px] mt-1.5 pt-1.5 font-mono border-t"
                                        style={{ borderColor: 'var(--border)' }}
                                      >
                                        <span style={{ color: 'var(--text-tertiary)' }}>Cost: {formatMoney(p.cost)}</span>
                                        <span style={{ color: 'var(--success)' }}>Sell: {formatMoney(p.sell)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tx.remarks && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <strong>Remarks:</strong> {tx.remarks}
                              </div>
                            )}

                            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              Created by {tx.createdBy?.name || 'System'} on {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <div>
          Showing {transactions.length} of {pagination.total} transactions
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Void Modal */}
      {voidTx && (
        <Modal
          isOpen={Boolean(voidTx)}
          onClose={() => setVoidTx(null)}
          title={`Void Transaction ${voidTx.ref}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Voiding this transaction will <strong>automatically reverse</strong> its effect on the client's due and supplier balance. The transaction record will remain preserved in the ledger as <code className="font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-secondary)' }}>VOIDED</code> for audit compliance.
            </p>
            <InputField
              label="Reason for Voiding *"
              required
              placeholder="e.g. Flight cancelled / Passenger duplicate entry"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setVoidTx(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={voidMutation.isPending}
                onClick={() => voidMutation.mutate({ id: voidTx._id, reason: voidReason })}
              >
                Confirm & Void
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Hard Delete Modal (Admin only) */}
      {deleteTx && (
        <ConfirmDialog
          isOpen={Boolean(deleteTx)}
          onClose={() => setDeleteTx(null)}
          onConfirm={() => deleteMutation.mutate(deleteTx._id)}
          loading={deleteMutation.isPending}
          title={`Permanently Delete ${deleteTx.ref}`}
          message="WARNING: Hard delete removes the transaction from the database. Any active balance effects will be reversed. Use this ONLY for same-day data entry mistakes."
          confirmText="Permanently Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
