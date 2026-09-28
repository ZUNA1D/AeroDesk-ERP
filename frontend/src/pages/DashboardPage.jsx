import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { dashboardApi } from '../api/dashboard.api.js';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import {
  Users,
  Wallet,
  Building,
  TrendingUp,
  PlaneTakeoff,
  Stamp,
  Receipt,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      navigate('/agencies', { replace: true });
    }
  }, [user, navigate]);

  // Date range state for profit filter
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({
    from: firstDayOfMonth,
    to: today
  });

  // Query summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30000
  });

  // Query filtered profit
  const { data: filteredProfitData, isLoading: isFilterLoading } = useQuery({
    queryKey: ['dashboard-filtered-profit', dateRange.from, dateRange.to],
    queryFn: () => dashboardApi.getFilteredProfit(dateRange),
    enabled: Boolean(dateRange.from && dateRange.to)
  });

  // Query expiring documents
  const { data: expiringData } = useQuery({
    queryKey: ['dashboard-expiring'],
    queryFn: dashboardApi.getExpiringDocs
  });

  const summary = summaryData?.summary || {
    totalClientDue: 0,
    portalWalletTotal: 0,
    agencyDueTotal: 0,
    allTimeProfit: 0,
    todaySales: 0,
    todayProfit: 0
  };

  const recentTxs = summaryData?.recentTransactions || [];
  const expiringClients = expiringData?.expiringClients || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Expiring passports notice if any */}
      {expiringClients.length > 0 && (
        <div
          className="rounded-xl p-4 flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--warning-muted)',
            border: '1px solid var(--warning)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
            <div className="text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
              <strong>Passport Expiry Notice:</strong> {expiringClients.length} client(s) have passports expiring within the next 90 days.
            </div>
          </div>
          <Button size="sm" variant="warning" onClick={() => navigate('/reports')}>
            View Details
          </Button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Client Due"
          value={summary.totalClientDue}
          icon={Users}
          variant="rose"
          subtitle="Receivable from clients"
          changeText="Pending Due"
          onClick={() => navigate('/ledger?type=TICKET_INVOICE,VISA_INVOICE')}
        />
        <StatCard
          title="Portal Wallet Balance"
          value={summary.portalWalletTotal}
          icon={Wallet}
          variant="sky"
          subtitle="Prepaid BSP/GDS Wallets"
          changeText="Active Funds"
          onClick={() => navigate('/suppliers?type=PORTAL')}
        />
        <StatCard
          title="Total Agency Due"
          value={summary.agencyDueTotal}
          icon={Building}
          variant="amber"
          subtitle="Payable to consolidators"
          changeText="Running Credit"
          onClick={() => navigate('/suppliers?type=AGENCY')}
        />
        <StatCard
          title="All-Time Net Profit"
          value={summary.allTimeProfit}
          icon={TrendingUp}
          variant="emerald"
          subtitle={`Today: BDT ${formatMoney(summary.todayProfit)}`}
          changeText="Net Margin"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Main Grid: Date-Range Profit Calculator & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date-Range Profit Calculator (2 cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Date-Range Profit Analysis"
            subtitle="Real-time aggregation of ticket & visa margins"
            action={
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: 'var(--text-tertiary)' }}>Range:</span>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="input-base text-xs !px-2 !py-1"
                />
                <span style={{ color: 'var(--text-tertiary)' }}>to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="input-base text-xs !px-2 !py-1"
                />
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Total Sales
                </span>
                <div className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  BDT {formatMoney(filteredProfitData?.totalSell || 0)}
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-tertiary)' }}>
                  {filteredProfitData?.count || 0} Invoices Issued
                </span>
              </div>

              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border)',
                }}
              >
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Total Cost (Buy)
                </span>
                <div className="text-xl font-bold mt-1" style={{ color: 'var(--text-secondary)' }}>
                  BDT {formatMoney(filteredProfitData?.totalBuy || 0)}
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-tertiary)' }}>
                  Supplier Expense
                </span>
              </div>

              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--success-muted)',
                  borderColor: 'rgba(16, 185, 129, 0.2)',
                }}
              >
                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--success)' }}>
                  Period Net Profit
                </span>
                <div className="text-2xl font-extrabold mt-1" style={{ color: 'var(--success)' }}>
                  BDT {formatMoney(filteredProfitData?.totalProfit || 0)}
                </div>
                <span className="text-[11px] mt-1 block font-semibold" style={{ color: 'var(--success)' }}>
                  {filteredProfitData?.totalSell > 0
                    ? `${Math.round((filteredProfitData.totalProfit / filteredProfitData.totalSell) * 10000) / 100}% Margin`
                    : '0% Margin'}
                </span>
              </div>
            </div>

            {/* Quick shortcuts */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <span
                className="text-xs font-semibold uppercase tracking-wider block mb-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Quick Actions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={PlaneTakeoff}
                  onClick={() => navigate('/invoice')}
                  className="justify-start"
                >
                  Issue Ticket
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Stamp}
                  onClick={() => navigate('/visa')}
                  className="justify-start"
                >
                  Visa Invoice
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Receipt}
                  onClick={() => navigate('/receipts')}
                  className="justify-start"
                >
                  Receive Cash
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Wallet}
                  onClick={() => navigate('/suppliers')}
                  className="justify-start"
                >
                  Wallet Top-up
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions list (1 col) */}
        <div>
          <Card
            title="Recent Activity"
            subtitle="Latest ledger events"
            action={
              <button
                onClick={() => navigate('/ledger')}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                View Ledger <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="space-y-2">
              {recentTxs.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  No transactions recorded yet.
                </div>
              ) : (
                recentTxs.map((tx) => (
                  <div
                    key={tx._id}
                    onClick={() => navigate('/ledger')}
                    className="p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs hover:shadow-sm"
                    style={{
                      backgroundColor: 'var(--surface-secondary)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
                          {tx.ref}
                        </span>
                        <Badge
                          variant={tx.status === 'VOIDED' ? 'voided' : tx.type.includes('INVOICE') ? 'primary' : 'success'}
                          size="xs"
                        >
                          {tx.type.replace('_INVOICE', '').replace('CLIENT_', '').replace('SUPPLIER_', '')}
                        </Badge>
                      </div>
                      <div
                        className="mt-1 font-medium truncate max-w-[160px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {tx.client?.name || tx.supplier?.name || 'Office Expense'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                        BDT {formatMoney(tx.totalSell || tx.amount || 0)}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(tx.date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
