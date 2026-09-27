import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatMoney } from '../../utils/formatMoney.js';

export function VisaRowsTable({
  passengers = [],
  sectors = [],
  onChange,
  onQuickAddSector
}) {
  const handleAddRow = () => {
    onChange([
      ...passengers,
      { name: '', visaNo: '', sector: '', cost: '', sell: '' }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (passengers.length === 1) return;
    const updated = passengers.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalBuy = passengers.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);
  const totalSell = passengers.reduce((sum, p) => sum + (Number(p.sell) || 0), 0);
  const totalProfit = totalSell - totalBuy;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          Visa & Passenger Details ({passengers.length} Pax)
        </h4>
        <Button size="sm" variant="secondary" icon={Plus} onClick={handleAddRow} type="button">
          Add Passenger
        </Button>
      </div>

      <div
        className="overflow-x-auto rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <table className="w-full text-left text-sm">
          <thead
            className="text-[11px] uppercase tracking-wider border-b"
            style={{
              backgroundColor: 'var(--table-header-bg)',
              color: 'var(--text-tertiary)',
              borderColor: 'var(--border)',
            }}
          >
            <tr>
              <th className="py-3 px-3 w-8 text-center">#</th>
              <th className="py-3 px-3 min-w-[180px]">Passenger Name *</th>
              <th className="py-3 px-3 min-w-[140px]">Visa / Reference No</th>
              <th className="py-3 px-3 min-w-[180px]">Sector / Country</th>
              <th className="py-3 px-3 min-w-[120px] text-right">Cost (Buy) *</th>
              <th className="py-3 px-3 min-w-[120px] text-right">Price (Sell) *</th>
              <th className="py-3 px-3 min-w-[110px] text-right">Profit</th>
              <th className="py-3 px-3 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {passengers.map((pax, index) => {
              const cost = Number(pax.cost) || 0;
              const sell = Number(pax.sell) || 0;
              const profit = sell - cost;

              return (
                <tr key={index} className="transition-colors hover:bg-[var(--table-row-hover)]">
                  <td className="py-2.5 px-3 text-center text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      required
                      placeholder="e.g. MOHAMMAD ALI"
                      value={pax.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                      className="input-base text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="e.g. V-8891234"
                      value={pax.visaNo}
                      onChange={(e) => handleFieldChange(index, 'visaNo', e.target.value)}
                      className="input-base text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={pax.sector}
                        onChange={(e) => handleFieldChange(index, 'sector', e.target.value)}
                        className="input-base text-xs cursor-pointer"
                      >
                        <option value="">Select Sector</option>
                        {sectors.map((sec) => (
                          <option key={sec._id} value={sec._id}>
                            {sec.name}
                          </option>
                        ))}
                      </select>
                      {onQuickAddSector && (
                        <button
                          type="button"
                          onClick={onQuickAddSector}
                          title="Quick add new sector"
                          className="p-1 rounded-md text-xs transition-colors"
                          style={{
                            backgroundColor: 'var(--surface-elevated)',
                            color: 'var(--accent)',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={pax.cost}
                      onChange={(e) => handleFieldChange(index, 'cost', e.target.value)}
                      className="input-base text-xs text-right font-mono"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={pax.sell}
                      onChange={(e) => handleFieldChange(index, 'sell', e.target.value)}
                      className="input-base text-xs font-bold text-right font-mono"
                      style={{ color: 'var(--success)' }}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs font-bold">
                    <span style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatMoney(profit)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={passengers.length === 1}
                      onClick={() => handleRemoveRow(index)}
                      className="p-1 disabled:opacity-30 transition-colors rounded-md hover:bg-[var(--danger-muted)]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot
            className="font-bold text-xs border-t-2"
            style={{
              backgroundColor: 'var(--table-header-bg)',
              borderColor: 'var(--border)',
            }}
          >
            <tr>
              <td colSpan="4" className="py-3 px-4 text-right uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Total Summary:
              </td>
              <td className="py-3 px-3 text-right font-mono" style={{ color: 'var(--accent)' }}>
                {formatMoney(totalBuy)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-sm" style={{ color: 'var(--success)' }}>
                {formatMoney(totalSell)}
              </td>
              <td className="py-3 px-3 text-right font-mono">
                <span className="text-sm" style={{ color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatMoney(totalProfit)}
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
