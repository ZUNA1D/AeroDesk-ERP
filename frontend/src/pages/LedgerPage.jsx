import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions.api.js';
import { clientsApi } from '../api/clients.api.js';
import { suppliersApi } from '../api/suppliers.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { TableSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { LedgerFilters } from './ledger/LedgerFilters.jsx';
import { VoidModal } from './ledger/VoidModal.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { openPrintDocument } from '../utils/print.js';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Printer,
  Ban,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

export function LedgerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

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

  // Fetch transactions query
  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', search, type, status, clientId, supplierId, from, to, page],
    queryFn: () =>
      transactionsApi.list({
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
      toast.success(`Transaction ${voidTx?.ref} has been voided.`);
      setVoidTx(null);
      setVoidReason('');
    },
    onError: (err) => toast.error(err.message || 'Failed to void transaction')
  });

  // Hard Delete Mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: (id) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Transaction permanently removed.');
      setDeleteTx(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete transaction')
  });

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintReceipt = (id) => {
    if (!id) return;
    openPrintDocument(`/transactions/${id}/receipt-pdf`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('');
    setStatus('ACTIVE');
    setClientId('');
    setSupplierId('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      toast.error('No transactions available to export.');
      return;
    }
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
    toast.success('CSV export generated.');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <BookOpen className="w-5 h-5 text-accent" />
            General Ledger
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
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
      <LedgerFilters
        search={search}
        setSearch={(val) => { setSearch(val); setPage(1); }}
        type={type}
        setType={(val) => { setType(val); setPage(1); }}
        status={status}
        setStatus={(val) => { setStatus(val); setPage(1); }}
        clientId={clientId}
        setClientId={(val) => { setClientId(val); setPage(1); }}
        supplierId={supplierId}
        setSupplierId={(val) => { setSupplierId(val); setPage(1); }}
        from={from}
        setFrom={(val) => { setFrom(val); setPage(1); }}
        to={to}
        setTo={(val) => { setTo(val); setPage(1); }}
        clients={clients}
        suppliers={suppliers}
        onReset={handleResetFilters}
      />

      {/* Transactions Table / Skeleton / Empty state */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={9} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Ledger Records Found"
          description="No transactions match the selected filters. Try changing or clearing your search filters."
          action={
            <Button size="sm" variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden p-0 border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="uppercase text-[11px] font-semibold tracking-wider border-b sticky top-0"
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <tr>
                  <th className="py-3 px-3 w-8 text-center"></th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Ref</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Party (Client / Supplier)</th>
                  <th className="py-3 px-3 text-right">Debit (Sell)</th>
                  <th className="py-3 px-3 text-right">Credit (Buy/Pay)</th>
                  <th className="py-3 px-3 text-right">Net Profit</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                {transactions.map((tx) => {
                  const isExpanded = Boolean(expandedRows[tx._id]);
                  const isVoided = tx.status === 'VOIDED';

                  return (
                    <React.Fragment key={tx._id}>
                      <tr
                        className={`transition-colors ${
                          isVoided
                            ? 'bg-danger-muted/30 opacity-70'
                            : 'hover:bg-[var(--table-row-hover)]'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          {(tx.passengers?.length > 0 || tx.remarks || tx.voidReason) && (
                            <button
                              type="button"
                              onClick={() => toggleRow(tx._id)}
                              className="p-1.5 rounded transition-colors text-theme-text-tertiary hover:bg-surface-secondary"
                              aria-label="Expand row details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-theme-text-secondary">
                          {new Date(tx.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-accent whitespace-nowrap">
                          {tx.ref}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              isVoided
                                ? 'voided'
                                : tx.type === 'TICKET_INVOICE'
                                ? 'primary'
                                : tx.type === 'VISA_INVOICE'
                                ? 'purple'
                                : tx.type === 'CLIENT_RECEIPT'
                                ? 'success'
                                : tx.type === 'SUPPLIER_DEPOSIT'
                                ? 'portal'
                                : tx.type === 'SUPPLIER_PAYMENT'
                                ? 'agency'
                                : 'neutral'
                            }
                            size="xs"
                          >
                            {tx.type.replace('_INVOICE', '').replace('CLIENT_', '').replace('SUPPLIER_', '')}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-theme-text-primary">
                            {tx.client?.name || tx.supplier?.name || 'Office Expense'}
                          </div>
                          {tx.passengers?.length > 0 && (
                            <div className="text-[10px] truncate max-w-[200px] text-theme-text-tertiary">
                              {tx.passengers.length} Pax: {tx.passengers.map((p) => p.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-success">
                          {tx.totalSell
                            ? formatMoney(tx.totalSell)
                            : tx.type === 'CLIENT_RECEIPT'
                            ? '-'
                            : formatMoney(tx.amount || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-theme-text-secondary">
                          {tx.totalBuy
                            ? formatMoney(tx.totalBuy)
                            : tx.type === 'CLIENT_RECEIPT'
                            ? formatMoney(tx.amount)
                            : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {tx.profit !== undefined ? (
                            <span className={tx.profit >= 0 ? 'text-success' : 'text-danger'}>
                              {formatMoney(tx.profit)}
                            </span>
                          ) : (
                            '-'
                          )}
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
                                type="button"
                                onClick={() => handlePrintReceipt(tx._id)}
                                title="Print Money Receipt Voucher"
                                className="p-1.5 rounded-md transition-colors hover:bg-surface-secondary text-theme-text-tertiary hover:text-theme-text-primary"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {!isVoided && (
                              <button
                                type="button"
                                onClick={() => setVoidTx(tx)}
                                title="Void Transaction"
                                className="p-1.5 rounded-md transition-colors hover:bg-warning-muted text-theme-text-tertiary hover:text-warning"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setDeleteTx(tx)}
                                title="Hard Delete (Admin Only)"
                                className="p-1.5 rounded-md transition-colors hover:bg-danger-muted text-theme-text-tertiary hover:text-danger"
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
                            className="p-4 border-y text-xs bg-surface-secondary"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div className="space-y-3 pl-6">
                              {isVoided && (
                                <div
                                  className="p-2.5 rounded-lg text-xs flex items-center gap-2 border bg-danger-muted text-danger"
                                  style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                >
                                  <Ban className="w-4 h-4 flex-shrink-0" />
                                  <span>
                                    <strong>Voided:</strong> {tx.voidReason || 'No reason provided'}
                                  </span>
                                </div>
                              )}

                              {tx.remarks && (
                                <div>
                                  <span className="font-semibold text-theme-text-tertiary block mb-0.5">
                                    Notes / Remarks:
                                  </span>
                                  <p className="text-theme-text-secondary">{tx.remarks}</p>
                                </div>
                              )}

                              {tx.passengers?.length > 0 && (
                                <div>
                                  <span className="font-semibold text-theme-text-tertiary block mb-1">
                                    Passengers ({tx.passengers.length}):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {tx.passengers.map((p, idx) => (
                                      <div
                                        key={idx}
                                        className="p-2 rounded-lg border bg-surface flex justify-between items-center text-xs"
                                        style={{ borderColor: 'var(--border)' }}
                                      >
                                        <span className="font-medium text-theme-text-primary">{p.name}</span>
                                        <span className="font-mono text-[11px] text-theme-text-tertiary">
                                          {p.ticketNumber || p.passportNumber || p.pnr || 'No Ref'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div
              className="p-3 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-secondary)' }}
            >
              <span className="text-theme-text-tertiary">
                Page {pagination.page} of {pagination.pages} ({pagination.total} records)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Void Modal */}
      <VoidModal
        tx={voidTx}
        onClose={() => { setVoidTx(null); setVoidReason(''); }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!voidTx) return;
          voidMutation.mutate({ id: voidTx._id, reason: voidReason });
        }}
        reason={voidReason}
        setReason={setVoidReason}
        loading={voidMutation.isPending}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTx)}
        onClose={() => setDeleteTx(null)}
        onConfirm={() => deleteMutation.mutate(deleteTx._id)}
        loading={deleteMutation.isPending}
        title={`Permanently Delete ${deleteTx?.ref}?`}
        message="This is a hard audit deletion. This record will be permanently erased. Are you sure you want to proceed?"
        confirmText="Hard Delete"
        variant="danger"
      />
    </div>
  );
}

export default LedgerPage;
