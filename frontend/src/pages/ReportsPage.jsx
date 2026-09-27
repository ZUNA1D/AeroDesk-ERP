import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api.js';
import { clientsApi } from '../api/clients.api.js';
import { suppliersApi } from '../api/suppliers.api.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { openPrintDocument } from '../utils/print.js';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  Building,
  TrendingUp,
  PlaneTakeoff,
  Stamp,
  Clock,
  Download
} from 'lucide-react';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('CLIENT_STATEMENT');
  // Options: 'CLIENT_STATEMENT' | 'SUPPLIER_STATEMENT' | 'TICKET_PROFIT' | 'VISA_PROFIT' | 'CLIENT_AGING'

  const today = new Date().toISOString().split('T')[0];
  const firstDayOfYear = `${new Date().getFullYear()}-01-01`;

  const [dateRange, setDateRange] = useState({
    from: firstDayOfYear,
    to: today
  });

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Fetch clients & suppliers for selectors
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

  // 1. Client Statement Query
  const { data: clientStatement, isLoading: isClientLoading } = useQuery({
    queryKey: ['report-client-statement', selectedClientId, dateRange.from, dateRange.to],
    queryFn: () => reportsApi.getClientStatement({
      clientId: selectedClientId,
      from: dateRange.from,
      to: dateRange.to
    }),
    enabled: Boolean(activeReport === 'CLIENT_STATEMENT' && selectedClientId)
  });

  // 2. Supplier Statement Query
  const { data: supplierStatement, isLoading: isSupplierLoading } = useQuery({
    queryKey: ['report-supplier-statement', selectedSupplierId, dateRange.from, dateRange.to],
    queryFn: () => reportsApi.getSupplierStatement({
      supplierId: selectedSupplierId,
      from: dateRange.from,
      to: dateRange.to
    }),
    enabled: Boolean(activeReport === 'SUPPLIER_STATEMENT' && selectedSupplierId)
  });

  // 3. Ticket Profit Query
  const { data: ticketProfit, isLoading: isTicketLoading } = useQuery({
    queryKey: ['report-ticket-profit', dateRange.from, dateRange.to],
    queryFn: () => reportsApi.getTicketProfit({
      from: dateRange.from,
      to: dateRange.to
    }),
    enabled: Boolean(activeReport === 'TICKET_PROFIT')
  });

  // 4. Visa Profit Query
  const { data: visaProfit, isLoading: isVisaLoading } = useQuery({
    queryKey: ['report-visa-profit', dateRange.from, dateRange.to],
    queryFn: () => reportsApi.getVisaProfit({
      from: dateRange.from,
      to: dateRange.to
    }),
    enabled: Boolean(activeReport === 'VISA_PROFIT')
  });

  // 5. Aging Report Query
  const { data: agingReport, isLoading: isAgingLoading } = useQuery({
    queryKey: ['report-aging'],
    queryFn: reportsApi.getAgingReport,
    enabled: Boolean(activeReport === 'CLIENT_AGING')
  });

  const handlePrintClientStatement = () => {
    if (!selectedClientId) return;
    openPrintDocument(`/reports/client-statement?clientId=${selectedClientId}&from=${dateRange.from}&to=${dateRange.to}&format=html`);
  };

  const handlePrintSupplierStatement = () => {
    if (!selectedSupplierId) return;
    openPrintDocument(`/reports/supplier-statement?supplierId=${selectedSupplierId}&from=${dateRange.from}&to=${dateRange.to}&format=html`);
  };

  const tabs = [
    { id: 'CLIENT_STATEMENT', label: 'Client Statement', icon: Users },
    { id: 'SUPPLIER_STATEMENT', label: 'Supplier Statement', icon: Building },
    { id: 'TICKET_PROFIT', label: 'Ticket Profit', icon: PlaneTakeoff },
    { id: 'VISA_PROFIT', label: 'Visa Profit', icon: Stamp },
    { id: 'CLIENT_AGING', label: 'Client Aging (Due Buckets)', icon: Clock }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <FileSpreadsheet className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            Financial Statements & Analytics
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Generate printable statements for clients and consolidators, ticket/visa margin reports, and aging receivables.
          </p>
        </div>
      </div>

      {/* Modern Report Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border"
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'var(--surface)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 2px 8px -1px var(--ring)' : 'none'
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Client Statement View */}
      {activeReport === 'CLIENT_STATEMENT' && (
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Select Client *
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="input-base text-sm cursor-pointer"
                >
                  <option value="">Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
            </div>
          </Card>

          {isClientLoading && (
            <div className="card p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Generating client statement...
            </div>
          )}

          {clientStatement && (
            <Card
              title={`Statement: ${clientStatement.client.name}`}
              subtitle={`Period: ${dateRange.from} to ${dateRange.to}`}
              action={
                <Button size="sm" variant="primary" icon={Printer} onClick={handlePrintClientStatement}>
                  Print / Download Statement
                </Button>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Opening Due</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                    BDT {formatMoney(clientStatement.openingDue)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>Period Billed</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                    +BDT {formatMoney(clientStatement.periodDebit)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.25)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--success)' }}>Period Received</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--success)' }}>
                    -BDT {formatMoney(clientStatement.periodCredit)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--danger)' }}>Closing Balance Due</span>
                  <div className="text-lg font-bold mt-1 font-mono" style={{ color: 'var(--danger)' }}>
                    BDT {formatMoney(clientStatement.closingDue)}
                  </div>
                </div>
              </div>

              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--border)' }}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className="uppercase text-[11px] font-semibold tracking-wider border-b"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Billed)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                      <th className="py-2.5 px-3 text-right">Running Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                    {clientStatement.rows.map((r) => (
                      <tr
                        key={r._id}
                        className="transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {r.ref}
                        </td>
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-primary)' }}>
                          {r.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                          {r.debit ? formatMoney(r.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: 'var(--success)' }}>
                          {r.credit ? formatMoney(r.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--danger)' }}>
                          BDT {formatMoney(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 2. Supplier Statement View */}
      {activeReport === 'SUPPLIER_STATEMENT' && (
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Select Supplier *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="input-base text-sm cursor-pointer"
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
            </div>
          </Card>

          {isSupplierLoading && (
            <div className="card p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Generating supplier statement...
            </div>
          )}

          {supplierStatement && (
            <Card
              title={`Supplier Statement: ${supplierStatement.supplier.name}`}
              subtitle={`Type: ${supplierStatement.supplier.type} • Period: ${dateRange.from} to ${dateRange.to}`}
              action={
                <Button size="sm" variant="primary" icon={Printer} onClick={handlePrintSupplierStatement}>
                  Print / Download Statement
                </Button>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Opening Balance</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                    BDT {formatMoney(supplierStatement.openingBalance)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>Total Cost Usage</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                    BDT {formatMoney(supplierStatement.totalCost)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.25)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--success)' }}>Total Deposits / Payments</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--success)' }}>
                    BDT {formatMoney(supplierStatement.totalDepositsOrPayments)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>Closing Balance</span>
                  <div className="text-lg font-bold mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                    BDT {formatMoney(supplierStatement.closingBalance)}
                  </div>
                </div>
              </div>

              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--border)' }}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className="uppercase text-[11px] font-semibold tracking-wider border-b"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Cost (Drawdown)</th>
                      <th className="py-2.5 px-3 text-right">Deposit / Payment</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                    {supplierStatement.rows.map((r) => (
                      <tr
                        key={r._id}
                        className="transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {r.ref}
                        </td>
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-primary)' }}>
                          {r.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                          {r.cost ? formatMoney(r.cost) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: 'var(--success)' }}>
                          {r.depositOrPayment ? formatMoney(r.depositOrPayment) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          BDT {formatMoney(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 3. Ticket Profit Report */}
      {activeReport === 'TICKET_PROFIT' && (
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
            </div>
          </Card>

          {isTicketLoading && (
            <div className="card p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Calculating ticket margins and analytics...
            </div>
          )}

          {ticketProfit && (
            <Card
              title="Ticket Profit & Volume Analysis"
              subtitle={`Showing ${ticketProfit.summary.totalInvoices} invoices, ${ticketProfit.summary.totalPax} passengers`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Ticket Sales</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                    BDT {formatMoney(ticketProfit.summary.totalSell)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Ticket Cost</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-secondary)' }}>
                    BDT {formatMoney(ticketProfit.summary.totalBuy)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.25)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--success)' }}>Net Profit Margin</span>
                  <div className="text-lg font-bold mt-1 font-mono" style={{ color: 'var(--success)' }}>
                    BDT {formatMoney(ticketProfit.summary.totalProfit)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>Margin Percentage</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                    {ticketProfit.summary.marginPercent}%
                  </div>
                </div>
              </div>

              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--border)' }}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className="uppercase text-[11px] font-semibold tracking-wider border-b"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Pax</th>
                      <th className="py-2.5 px-3 text-right">Cost (Buy)</th>
                      <th className="py-2.5 px-3 text-right">Price (Sell)</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                    {ticketProfit.rows.map((r) => (
                      <tr
                        key={r._id}
                        className="transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {r.ref}
                        </td>
                        <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {r.clientName}
                        </td>
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {r.supplierName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                          {r.paxCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(r.totalBuy)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(r.totalSell)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--success)' }}>
                          {formatMoney(r.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 4. Visa Profit Report */}
      {activeReport === 'VISA_PROFIT' && (
        <div className="space-y-6">
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-base text-sm"
                />
              </div>
            </div>
          </Card>

          {isVisaLoading && (
            <div className="card p-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
              Calculating visa profits and margins...
            </div>
          )}

          {visaProfit && (
            <Card
              title="Visa Profit & Margin Analysis"
              subtitle={`Showing ${visaProfit.summary.totalInvoices} invoices, ${visaProfit.summary.totalPax} visa cases`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Visa Sales</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                    BDT {formatMoney(visaProfit.summary.totalSell)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Visa Cost</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-secondary)' }}>
                    BDT {formatMoney(visaProfit.summary.totalBuy)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.25)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--success)' }}>Net Profit Margin</span>
                  <div className="text-lg font-bold mt-1 font-mono" style={{ color: 'var(--success)' }}>
                    BDT {formatMoney(visaProfit.summary.totalProfit)}
                  </div>
                </div>
                <div
                  className="p-3.5 rounded-xl border"
                  style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ color: 'var(--accent)' }}>Margin Percentage</span>
                  <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--accent)' }}>
                    {visaProfit.summary.marginPercent}%
                  </div>
                </div>
              </div>

              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: 'var(--border)' }}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className="uppercase text-[11px] font-semibold tracking-wider border-b"
                    style={{
                      backgroundColor: 'var(--table-header-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Ref</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Pax</th>
                      <th className="py-2.5 px-3 text-right">Cost (Buy)</th>
                      <th className="py-2.5 px-3 text-right">Price (Sell)</th>
                      <th className="py-2.5 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                    {visaProfit.rows.map((r) => (
                      <tr
                        key={r._id}
                        className="transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {r.ref}
                        </td>
                        <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {r.clientName}
                        </td>
                        <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                          {r.supplierName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                          {r.paxCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(r.totalBuy)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(r.totalSell)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--success)' }}>
                          {formatMoney(r.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 5. Client Aging Report */}
      {activeReport === 'CLIENT_AGING' && agingReport && (
        <Card
          title="Accounts Receivable Aging Analysis"
          subtitle="Outstanding client balances categorized by overdue durations"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--danger)' }}>Total Due</span>
              <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--danger)' }}>
                BDT {formatMoney(agingReport.summary.grandTotalDue)}
              </div>
            </div>
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.25)' }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--success)' }}>0 - 30 Days</span>
              <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                BDT {formatMoney(agingReport.summary.total0To30)}
              </div>
            </div>
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--ring)' }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--accent)' }}>31 - 60 Days</span>
              <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                BDT {formatMoney(agingReport.summary.total31To60)}
              </div>
            </div>
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--warning-muted)', borderColor: 'rgba(245, 158, 11, 0.25)' }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--warning)' }}>61 - 90 Days</span>
              <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                BDT {formatMoney(agingReport.summary.total61To90)}
              </div>
            </div>
            <div
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--danger)' }}>90+ Days (Overdue)</span>
              <div className="text-base font-bold mt-1 font-mono" style={{ color: 'var(--danger)' }}>
                BDT {formatMoney(agingReport.summary.total90Plus)}
              </div>
            </div>
          </div>

          <div
            className="overflow-x-auto rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
          >
            <table className="w-full text-left text-xs">
              <thead
                className="uppercase text-[11px] font-semibold tracking-wider border-b"
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <tr>
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">0 - 30 Days</th>
                  <th className="py-2.5 px-3 text-right">31 - 60 Days</th>
                  <th className="py-2.5 px-3 text-right">61 - 90 Days</th>
                  <th className="py-2.5 px-3 text-right">90+ Days</th>
                  <th className="py-2.5 px-3 text-right">Current Due</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                {agingReport.clients.map((c) => (
                  <tr
                    key={c.clientId}
                    className="transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {c.clientName}
                    </td>
                    <td className="py-2.5 px-3" style={{ color: 'var(--text-secondary)' }}>
                      {c.phone || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatMoney(c.bucket0_30)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatMoney(c.bucket31_60)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono" style={{ color: 'var(--warning)' }}>
                      {formatMoney(c.bucket61_90)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: 'var(--danger)' }}>
                      {formatMoney(c.bucket90Plus)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm" style={{ color: 'var(--danger)' }}>
                      BDT {formatMoney(c.currentDue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
