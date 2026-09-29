import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api.js';
import { clientsApi } from '../api/clients.api.js';
import { suppliersApi } from '../api/suppliers.api.js';
import {
  Users,
  Building,
  PlaneTakeoff,
  Stamp,
  Clock
} from 'lucide-react';
import { ClientStatementReport } from './reports/ClientStatementReport.jsx';
import { SupplierStatementReport } from './reports/SupplierStatementReport.jsx';
import { TicketProfitReport } from './reports/TicketProfitReport.jsx';
import { VisaProfitReport } from './reports/VisaProfitReport.jsx';
import { ClientAgingReport } from './reports/ClientAgingReport.jsx';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState('CLIENT_STATEMENT');

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
    queryFn: () =>
      reportsApi.getClientStatement({
        clientId: selectedClientId,
        from: dateRange.from,
        to: dateRange.to
      }),
    enabled: Boolean(activeReport === 'CLIENT_STATEMENT' && selectedClientId)
  });

  // 2. Supplier Statement Query
  const { data: supplierStatement, isLoading: isSupplierLoading } = useQuery({
    queryKey: ['report-supplier-statement', selectedSupplierId, dateRange.from, dateRange.to],
    queryFn: () =>
      reportsApi.getSupplierStatement({
        supplierId: selectedSupplierId,
        from: dateRange.from,
        to: dateRange.to
      }),
    enabled: Boolean(activeReport === 'SUPPLIER_STATEMENT' && selectedSupplierId)
  });

  // 3. Ticket Profit Query
  const { data: ticketProfit, isLoading: isTicketLoading } = useQuery({
    queryKey: ['report-ticket-profit', dateRange.from, dateRange.to],
    queryFn: () =>
      reportsApi.getTicketProfit({
        from: dateRange.from,
        to: dateRange.to
      }),
    enabled: Boolean(activeReport === 'TICKET_PROFIT')
  });

  // 4. Visa Profit Query
  const { data: visaProfit, isLoading: isVisaLoading } = useQuery({
    queryKey: ['report-visa-profit', dateRange.from, dateRange.to],
    queryFn: () =>
      reportsApi.getVisaProfit({
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

  const tabs = [
    { id: 'CLIENT_STATEMENT', label: 'Client Statement', icon: Users },
    { id: 'SUPPLIER_STATEMENT', label: 'Supplier Statement', icon: Building },
    { id: 'TICKET_PROFIT', label: 'Ticket Profit', icon: PlaneTakeoff },
    { id: 'VISA_PROFIT', label: 'Visa Profit', icon: Stamp },
    { id: 'CLIENT_AGING', label: 'Client Aging (Due Buckets)', icon: Clock }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: 'var(--text-primary)' }}
        >
          Financial Intelligence & Reports
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Audit trail, ledger statements, profitability metrics, and debtor aging.
        </p>
      </div>

      {/* Report Tabs */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary hover:bg-surface-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeReport === 'CLIENT_STATEMENT' && (
        <ClientStatementReport
          clients={clients}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          dateRange={dateRange}
          setDateRange={setDateRange}
          statement={clientStatement}
          isLoading={isClientLoading}
        />
      )}

      {activeReport === 'SUPPLIER_STATEMENT' && (
        <SupplierStatementReport
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          dateRange={dateRange}
          setDateRange={setDateRange}
          statement={supplierStatement}
          isLoading={isSupplierLoading}
        />
      )}

      {activeReport === 'TICKET_PROFIT' && (
        <TicketProfitReport
          dateRange={dateRange}
          setDateRange={setDateRange}
          ticketProfit={ticketProfit}
          isLoading={isTicketLoading}
        />
      )}

      {activeReport === 'VISA_PROFIT' && (
        <VisaProfitReport
          dateRange={dateRange}
          setDateRange={setDateRange}
          visaProfit={visaProfit}
          isLoading={isVisaLoading}
        />
      )}

      {activeReport === 'CLIENT_AGING' && (
        <ClientAgingReport
          agingReport={agingReport}
          isLoading={isAgingLoading}
        />
      )}
    </div>
  );
}

export default ReportsPage;
