import React from 'react';
import { Plus, Trash2, Copy, Stamp } from 'lucide-react';
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

  const handleDuplicateRow = (index) => {
    const source = passengers[index];
    onChange([
      ...passengers.slice(0, index + 1),
      {
        name: '',
        visaNo: '',
        sector: source.sector || '',
        cost: source.cost || '',
        sell: source.sell || ''
      },
      ...passengers.slice(index + 1)
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
  const marginPercent = totalSell > 0 ? ((totalProfit / totalSell) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Visa & Passenger Details ({passengers.length} Pax)
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Enter visa applicants or duplicate sector and embassy fees for group travelers.
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={handleAddRow} type="button">
          Add Passenger
        </Button>
      </div>

      {/* ─── Mobile View (< md screens): Card-Based ─── */}
      <div className="block md:hidden space-y-4">
        {passengers.map((pax, index) => {
          const cost = Number(pax.cost) || 0;
          const sell = Number(pax.sell) || 0;
          const profit = sell - cost;

          return (
            <div
              key={index}
              className="p-4 rounded-xl border space-y-3.5"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Applicant #{index + 1}
                  </span>
                  {pax.cost && pax.sell && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        profit >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}
                    >
                      {profit >= 0 ? `+BDT ${formatMoney(profit)}` : `-BDT ${formatMoney(Math.abs(profit))}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateRow(index)}
                    title="Duplicate sector & fees to next applicant"
                    className="p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors hover:bg-[var(--surface-secondary)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <Copy className="w-3.5 h-3.5 text-brand-600" />
                    <span className="text-[11px]">Duplicate</span>
                  </button>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      title="Remove applicant"
                      className="p-1.5 rounded-lg border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Applicant Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MOHAMMAD ALI"
                    value={pax.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                    className="input-base text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Visa / Reference No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. V-8891234"
                      value={pax.visaNo}
                      onChange={(e) => handleFieldChange(index, 'visaNo', e.target.value)}
                      className="input-base text-sm font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Sector / Country
                      </label>
                      {onQuickAddSector && (
                        <button
                          type="button"
                          onClick={onQuickAddSector}
                          className="text-[10px] text-brand-600 font-semibold"
                        >
                          + New
                        </button>
                      )}
                    </div>
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Buying Cost *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={pax.cost}
                      onChange={(e) => handleFieldChange(index, 'cost', e.target.value)}
                      className="input-base text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={pax.sell}
                      onChange={(e) => handleFieldChange(index, 'sell', e.target.value)}
                      className="input-base text-sm font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Total Bar */}
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div>
            <span className="block font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total: BDT {formatMoney(totalSell)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Cost: BDT {formatMoney(totalBuy)}
            </span>
          </div>
          <div className="text-right">
            <span className={`block font-bold font-mono text-sm ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalProfit >= 0 ? `+BDT ${formatMoney(totalProfit)}` : `-BDT ${formatMoney(Math.abs(totalProfit))}`}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {marginPercent}% Margin
            </span>
          </div>
        </div>
      </div>

      {/* ─── Desktop View (>= md screens): Full Speed Data Table ─── */}
      <div
        className="hidden md:block overflow-x-auto rounded-lg border"
        style={{
          backgroundColor: 'var(--surface)',
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
              <th className="py-2.5 px-2.5 w-8 text-center">#</th>
              <th className="py-2.5 px-2.5 min-w-[180px]">Applicant Name *</th>
              <th className="py-2.5 px-2.5 min-w-[140px]">Visa / Reference No</th>
              <th className="py-2.5 px-2.5 min-w-[180px]">Sector / Country</th>
              <th className="py-2.5 px-2.5 min-w-[120px] text-right">Cost (Buy) *</th>
              <th className="py-2.5 px-2.5 min-w-[120px] text-right">Price (Sell) *</th>
              <th className="py-2.5 px-2.5 min-w-[100px] text-right">Profit</th>
              <th className="py-2.5 px-2.5 w-16 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {passengers.map((pax, index) => {
              const cost = Number(pax.cost) || 0;
              const sell = Number(pax.sell) || 0;
              const profit = sell - cost;

              return (
                <tr key={index} className="transition-colors hover:bg-[var(--table-row-hover)]">
                  <td className="py-2 px-2.5 text-center text-xs font-mono font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {index + 1}
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      required
                      placeholder="MOHAMMAD ALI"
                      value={pax.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                      className="input-base text-xs font-medium"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      placeholder="V-8891234"
                      value={pax.visaNo}
                      onChange={(e) => handleFieldChange(index, 'visaNo', e.target.value)}
                      className="input-base text-xs font-mono"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <div className="flex items-center gap-1">
                      <select
                        value={pax.sector}
                        onChange={(e) => handleFieldChange(index, 'sector', e.target.value)}
                        className="input-base text-xs cursor-pointer py-1.5"
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
                          className="p-1 rounded-md text-xs transition-colors hover:bg-[var(--surface-secondary)] text-brand-600 border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-right">
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
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={pax.sell}
                      onChange={(e) => handleFieldChange(index, 'sell', e.target.value)}
                      className="input-base text-xs font-bold text-right font-mono text-emerald-600"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono text-xs font-bold">
                    <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatMoney(profit)}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRow(index)}
                        title="Duplicate sector & fees to new row"
                        className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={passengers.length === 1}
                        onClick={() => handleRemoveRow(index)}
                        title="Remove applicant"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded disabled:opacity-20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                Total Visa Summary:
              </td>
              <td className="py-3 px-2.5 text-right font-mono" style={{ color: 'var(--accent)' }}>
                {formatMoney(totalBuy)}
              </td>
              <td className="py-3 px-2.5 text-right font-mono text-sm text-emerald-600">
                {formatMoney(totalSell)}
              </td>
              <td className="py-3 px-2.5 text-right font-mono">
                <span className={`text-sm ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMoney(totalProfit)}
                </span>
                <div className="text-[10px] text-emerald-600 font-medium">
                  {marginPercent}% margin
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default VisaRowsTable;
