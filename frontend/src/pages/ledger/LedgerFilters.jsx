import React, { useState } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Combobox } from '../../components/ui/Combobox.jsx';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: c.name,
    subtext: c.phone || ''
  }));

  const supplierOptions = suppliers.map((s) => ({
    value: s._id,
    label: s.name,
    subtext: s.type
  }));

  const activeFilterCount = [
    type,
    status !== 'ACTIVE' ? status : '',
    clientId,
    supplierId,
    from,
    to
  ].filter(Boolean).length;

  return (
    <Card>
      <div className="space-y-3">
        {/* Top bar: Search + Mobile filter toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-3 top-2.5"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              type="text"
              placeholder="Search Ref, Pax, PNR, Ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 text-xs w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 p-0.5 rounded hover:opacity-70"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-surface-secondary"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <Filter className="w-3.5 h-3.5 text-accent" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter controls: Always visible on desktop (lg:grid), collapsible on mobile */}
        <div
          className={`${
            showMobileFilters ? 'block' : 'hidden'
          } lg:block space-y-3 pt-2 lg:pt-0`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-base text-xs cursor-pointer w-full"
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
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-base text-xs cursor-pointer w-full"
              >
                <option value="">All Statuses (Active + Voided)</option>
                <option value="ACTIVE">Active Transactions Only</option>
                <option value="VOIDED">Voided Transactions Only</option>
              </select>
            </div>

            {/* Client Filter Combobox */}
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Client
              </label>
              <Combobox
                placeholder="All Clients"
                searchPlaceholder="Search client..."
                value={clientId}
                onChange={setClientId}
                options={clientOptions}
              />
            </div>

            {/* Supplier Filter Combobox */}
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Supplier
              </label>
              <Combobox
                placeholder="All Suppliers"
                searchPlaceholder="Search supplier..."
                value={supplierId}
                onChange={setSupplierId}
                options={supplierOptions}
              />
            </div>
          </div>

          {/* Date range & Reset bar */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t text-xs"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Date Range:
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="input-base text-xs py-1 px-2"
                placeholder="From"
              />
              <span style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input-base text-xs py-1 px-2"
                placeholder="To"
              />
            </div>

            {(activeFilterCount > 0 || search) && (
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] font-semibold text-danger hover:underline self-end sm:self-auto py-1"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
