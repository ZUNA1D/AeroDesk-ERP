import React from 'react';
import { Search, X, ChevronDown, Calendar, RotateCcw } from 'lucide-react';

export function LedgerFilters({
  search,
  setSearch,
  type,
  setType,
  status,
  setStatus,
  clientId,
  setClientId,
  supplierId,
  setSupplierId,
  from,
  setFrom,
  to,
  setTo,
  clients = [],
  suppliers = [],
  onReset
}) {
  const activeFilterCount = [
    type,
    status !== 'ACTIVE' ? status : '',
    clientId,
    supplierId,
    from,
    to,
    search
  ].filter(Boolean).length;

  return (
    <div
      className="p-4 rounded-xl border space-y-3 shadow-sm transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Row 1: Search + Transaction Type + Status + Clients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Search Bar */}
        <div className="relative">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search Ref, Pax, PNR, Ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70"
            >
              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>

        {/* 2. All Transaction Types Dropdown */}
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)',
              color: type ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
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
          <ChevronDown
            className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>

        {/* 3. Status Dropdown */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="ACTIVE">Active Transactions Only</option>
            <option value="">All Statuses (Active + Voided)</option>
            <option value="VOIDED">Voided Transactions Only</option>
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>

        {/* 4. Clients Dropdown */}
        <div className="relative">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)',
              color: clientId ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      </div>

      {/* Row 2: All Suppliers + From Date + To Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* 1. Suppliers Dropdown */}
        <div className="relative lg:col-span-4">
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              backgroundColor: 'var(--surface-secondary)',
              borderColor: 'var(--border)',
              color: supplierId ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.type})
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>

        {/* 2. From Date Picker */}
        <div
          className="flex items-center rounded-lg border px-3 py-1.5 lg:col-span-4"
          style={{
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <span
            className="text-xs font-normal mr-2 select-none flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            From:
          </span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs w-full cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* 3. To Date Picker */}
        <div
          className="flex items-center rounded-lg border px-3 py-1.5 lg:col-span-4"
          style={{
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <span
            className="text-xs font-normal mr-2 select-none flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            To:
          </span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs w-full cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Active Filter Clear Bar (appears when filters are applied) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
          </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
