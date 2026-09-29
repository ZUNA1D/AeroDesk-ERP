import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SummaryGrid } from './SummaryGrid.jsx';
import { DateRangeFilter } from './DateRangeFilter.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { Stamp } from 'lucide-react';

export function VisaProfitReport({
  dateRange,
  setDateRange,
  visaProfit,
  isLoading
}) {
  const summaryItems = visaProfit
    ? [
        { label: 'Total Visa Sales', value: visaProfit.summary.totalSell, variant: 'neutral' },
        { label: 'Total Visa Cost', value: visaProfit.summary.totalBuy, variant: 'neutral' },
        { label: 'Net Profit Margin', value: visaProfit.summary.totalProfit, variant: 'green' },
        { label: 'Margin Percentage', value: `${visaProfit.summary.marginPercent}%`, variant: 'blue' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />

      {isLoading && <TableSkeleton rows={6} cols={9} />}

      {!isLoading && visaProfit && (
        <Card
          title="Visa Profit & Margin Analysis"
          subtitle={`Analyzed ${visaProfit.summary.totalInvoices} visa invoices with ${visaProfit.summary.totalPax} visa applications`}
        >
          <SummaryGrid items={summaryItems} className="mb-6" />

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
                {visaProfit.rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-theme-text-tertiary">
                      No visa invoices recorded within this date range.
                    </td>
                  </tr>
                ) : (
                  visaProfit.rows.map((r) => (
                    <tr
                      key={r._id}
                      className="transition-colors hover:bg-[var(--table-row-hover)]"
                    >
                      <td className="py-2.5 px-3 text-theme-text-secondary whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-accent whitespace-nowrap">
                        {r.ref}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-theme-text-primary">
                        {r.clientName}
                      </td>
                      <td className="py-2.5 px-3 text-theme-text-secondary">
                        {r.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-theme-text-primary">
                        {r.paxCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-theme-text-secondary">
                        {formatMoney(r.totalBuy)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-theme-text-primary">
                        {formatMoney(r.totalSell)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          r.profit >= 0 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {formatMoney(r.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && !visaProfit && (
        <EmptyState
          icon={Stamp}
          title="No Visa Data"
          description="Adjust the date range above to view visa invoice analytics."
        />
      )}
    </div>
  );
}
