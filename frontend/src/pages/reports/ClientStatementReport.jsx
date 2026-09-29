import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SummaryGrid } from './SummaryGrid.jsx';
import { DateRangeFilter } from './DateRangeFilter.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { openPrintDocument } from '../../utils/print.js';
import { Users, FileText } from 'lucide-react';

export function ClientStatementReport({
  clients = [],
  selectedClientId,
  setSelectedClientId,
  dateRange,
  setDateRange,
  statement,
  isLoading
}) {
  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: c.name,
    subtext: c.phone || 'No phone'
  }));

  const handlePrint = () => {
    if (!selectedClientId) return;
    openPrintDocument(
      `/reports/client-statement?clientId=${selectedClientId}&from=${dateRange.from}&to=${dateRange.to}&format=html`
    );
  };

  const summaryItems = statement
    ? [
        { label: 'Opening Due', value: statement.openingDue, variant: 'neutral' },
        { label: 'Period Billed', value: `+${formatMoney(statement.periodDebit)}`, variant: 'blue' },
        { label: 'Period Received', value: `-${formatMoney(statement.periodCredit)}`, variant: 'green' },
        { label: 'Closing Due', value: statement.closingDue, variant: 'red' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DateRangeFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        showEntitySelect
        entityLabel="Select Client *"
        entityPlaceholder="Search client by name or phone..."
        entityValue={selectedClientId}
        onEntityChange={setSelectedClientId}
        entityOptions={clientOptions}
        onPrint={handlePrint}
        printTitle="Print Statement"
      />

      {isLoading && <TableSkeleton rows={6} cols={6} />}

      {!isLoading && !selectedClientId && (
        <EmptyState
          icon={Users}
          title="Select a Client"
          description="Choose a client from the dropdown above to view their financial ledger statement and running dues."
        />
      )}

      {!isLoading && statement && (
        <Card
          title={`Statement: ${statement.client.name}`}
          subtitle={`Period: ${dateRange.from} to ${dateRange.to}`}
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
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (Billed)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                  <th className="py-2.5 px-3 text-right">Running Due</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                {statement.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-theme-text-tertiary">
                      No statement transactions recorded in this date range.
                    </td>
                  </tr>
                ) : (
                  statement.rows.map((r) => (
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
                      <td className="py-2.5 px-3 text-theme-text-primary">
                        {r.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-theme-text-primary">
                        {r.debit ? formatMoney(r.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-success">
                        {r.credit ? formatMoney(r.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-danger">
                        BDT {formatMoney(r.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
