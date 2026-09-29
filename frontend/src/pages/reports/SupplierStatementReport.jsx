import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SummaryGrid } from './SummaryGrid.jsx';
import { DateRangeFilter } from './DateRangeFilter.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { openPrintDocument } from '../../utils/print.js';
import { Building2 } from 'lucide-react';

export function SupplierStatementReport({
  suppliers = [],
  selectedSupplierId,
  setSelectedSupplierId,
  dateRange,
  setDateRange,
  statement,
  isLoading
}) {
  const supplierOptions = suppliers.map((s) => ({
    value: s._id,
    label: s.name,
    subtext: `${s.type} • Balance: BDT ${formatMoney(s.balance)}`
  }));

  const handlePrint = () => {
    if (!selectedSupplierId) return;
    openPrintDocument(
      `/reports/supplier-statement?supplierId=${selectedSupplierId}&from=${dateRange.from}&to=${dateRange.to}&format=html`
    );
  };

  const summaryItems = statement
    ? [
        { label: 'Opening Balance', value: statement.openingBalance, variant: 'neutral' },
        { label: 'Purchases (Cost)', value: `+${formatMoney(statement.periodDebit)}`, variant: 'blue' },
        { label: 'Deposits / Paid', value: `-${formatMoney(statement.periodCredit)}`, variant: 'green' },
        { label: 'Closing Balance', value: statement.closingBalance, variant: 'amber' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DateRangeFilter
        dateRange={dateRange}
        setDateRange={setDateRange}
        showEntitySelect
        entityLabel="Select Supplier *"
        entityPlaceholder="Search supplier or portal..."
        entityValue={selectedSupplierId}
        onEntityChange={setSelectedSupplierId}
        entityOptions={supplierOptions}
        onPrint={handlePrint}
        printTitle="Print Statement"
      />

      {isLoading && <TableSkeleton rows={6} cols={6} />}

      {!isLoading && !selectedSupplierId && (
        <EmptyState
          icon={Building2}
          title="Select a Supplier"
          description="Choose a BSP portal or credit agency above to view supplier billing history and wallet transactions."
        />
      )}

      {!isLoading && statement && (
        <Card
          title={`Supplier Statement: ${statement.supplier.name}`}
          subtitle={`Period: ${dateRange.from} to ${dateRange.to} • Type: ${statement.supplier.type}`}
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
                  <th className="py-2.5 px-3 text-right">Debit (Cost)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Paid/Topup)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium" style={{ borderColor: 'var(--border)' }}>
                {statement.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-theme-text-tertiary">
                      No supplier transactions recorded in this date range.
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
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-warning">
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
