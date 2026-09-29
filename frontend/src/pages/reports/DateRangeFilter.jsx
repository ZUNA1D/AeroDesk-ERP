import React from 'react';
import { Calendar, Printer, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Combobox } from '../../components/ui/Combobox.jsx';

export function DateRangeFilter({
  dateRange,
  setDateRange,
  showEntitySelect = false,
  entityLabel = 'Select Client',
  entityPlaceholder = 'Search client...',
  entityValue,
  onEntityChange,
  entityOptions = [],
  onPrint,
  printLoading = false,
  printTitle = 'Print / PDF'
}) {
  const applyPreset = (preset) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setDateRange({ from: todayStr, to: todayStr });
    } else if (preset === 'THIS_MONTH') {
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setDateRange({ from: firstDay, to: todayStr });
    } else if (preset === 'THIS_YEAR') {
      const firstDay = `${now.getFullYear()}-01-01`;
      setDateRange({ from: firstDay, to: todayStr });
    } else if (preset === 'LAST_30') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateRange({ from: thirtyDaysAgo, to: todayStr });
    }
  };

  return (
    <div
      className="card p-4 sm:p-5 border space-y-4"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        {/* Left side: Entity select & Date range */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1">
          {showEntitySelect && (
            <div className="min-w-[240px] flex-1">
              <Combobox
                label={entityLabel}
                placeholder={entityPlaceholder}
                value={entityValue}
                onChange={onEntityChange}
                options={entityOptions}
              />
            </div>
          )}

          <div className="flex-1 min-w-[140px]">
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="input-base text-xs w-full"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="input-base text-xs w-full"
            />
          </div>
        </div>

        {/* Right side: Print/Download Actions */}
        {onPrint && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              icon={Printer}
              onClick={onPrint}
              loading={printLoading}
              disabled={showEntitySelect && !entityValue}
            >
              {printTitle}
            </Button>
          </div>
        )}
      </div>

      {/* Quick date presets */}
      <div
        className="flex items-center gap-1.5 flex-wrap pt-2 border-t text-xs"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-[11px] font-medium mr-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Quick Presets:
        </span>
        {[
          { label: 'Today', key: 'TODAY' },
          { label: 'Last 30 Days', key: 'LAST_30' },
          { label: 'This Month', key: 'THIS_MONTH' },
          { label: 'This Year', key: 'THIS_YEAR' },
        ].map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p.key)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border hover:bg-surface-secondary"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
