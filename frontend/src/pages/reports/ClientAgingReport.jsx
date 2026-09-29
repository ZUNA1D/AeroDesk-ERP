import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SummaryGrid } from './SummaryGrid.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { Clock } from 'lucide-react';

export function ClientAgingReport({
  agingReport,
  isLoading
}) {
  const summaryItems = agingReport
    ? [
        { label: 'Total Due (All Buckets)', value: agingReport.summary.grandTotalDue, variant: 'red' },
        { label: 'Current (0-30 Days)', value: agingReport.summary.total0To30, variant: 'green' },
        { label: '31-60 Days Overdue', value: agingReport.summary.total31To60, variant: 'blue' },
        { label: '61-90 Days Overdue', value: agingReport.summary.total61To90, variant: 'amber' },
        { label: '90+ Days Critical Due', value: agingReport.summary.total90Plus, variant: 'red' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {isLoading && <TableSkeleton rows={6} cols={7} />}

      {!isLoading && agingReport && (
        <Card
          title="Accounts Receivable Aging Breakdown"
          subtitle="Outstanding client balances grouped into 30-day risk buckets"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className="card p-3 border relative overflow-hidden"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <span
                  className="text-[10px] font-bold uppercase block truncate"
                  style={{
                    color:
                      item.variant === 'red'
                        ? 'var(--danger)'
                        : item.variant === 'green'
                        ? 'var(--success)'
                        : item.variant === 'blue'
                        ? 'var(--accent)'
                        : 'var(--warning)',
                  }}
                >
                  {item.label}
                </span>
                <div
                  className="text-base font-bold mt-1 font-mono tracking-tight"
                  style={{
                    color:
                      item.variant === 'red'
                        ? 'var(--danger)'
                        : 'var(--text-primary)',
                  }}
                >
                  BDT {formatMoney(item.value)}
                </div>
              </div>
            ))}
          </div>

          <div
            className="overflow-x-auto rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
          >
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
                {agingReport.clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-theme-text-tertiary">
                      No overdue balances found across any clients.
                    </td>
                  </tr>
                ) : (
                  agingReport.clients.map((c) => (
                    <tr
                      key={c.clientId}
                      className="transition-colors hover:bg-[var(--table-row-hover)]"
                    >
                      <td className="py-2.5 px-3 font-semibold text-theme-text-primary">
                        {c.clientName}
                      </td>
                      <td className="py-2.5 px-3 text-theme-text-secondary">
                        {c.phone || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-theme-text-secondary">
                        {formatMoney(c.bucket0_30)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-theme-text-secondary">
                        {formatMoney(c.bucket31_60)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-warning">
                        {formatMoney(c.bucket61_90)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-danger">
                        {formatMoney(c.bucket90Plus)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-danger whitespace-nowrap">
                        BDT {formatMoney(c.currentDue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && !agingReport && (
        <EmptyState
          icon={Clock}
          title="No Aging Data"
          description="Client accounts receivable aging report could not be loaded."
        />
      )}
    </div>
  );
}
