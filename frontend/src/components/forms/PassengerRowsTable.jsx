import React from 'react';
import { Plus, Trash2, Copy, Plane, User, Ticket, MapPin } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatMoney } from '../../utils/formatMoney.js';

const POPULAR_ROUTES = ['DAC-JED', 'DAC-DXB', 'DAC-KUL', 'DAC-SIN', 'DAC-LHR'];

export function PassengerRowsTable({
  passengers = [],
  airlines = [],
  onChange,
  onQuickAddAirline
}) {
  const handleAddRow = () => {
    onChange([
      ...passengers,
      { name: '', ticketNo: '', pnr: '', airline: '', route: '', cost: '', sell: '' }
    ]);
  };

  const handleDuplicateRow = (index) => {
    const source = passengers[index];
    onChange([
      ...passengers.slice(0, index + 1),
      {
        name: '',
        ticketNo: '',
        pnr: source.pnr || '',
        airline: source.airline || '',
        route: source.route || '',
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
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Passenger & Ticket Details ({passengers.length} Pax)
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Enter passenger information or duplicate common group route/fares.
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={Plus} onClick={handleAddRow} type="button">
          Add Passenger
        </Button>
      </div>

      {/* ─── Mobile View (< md screens): Card Based for Easy Tapping ─── */}
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
              {/* Card Header */}
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Passenger #{index + 1}
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
                    title="Duplicate flight & fare details to next row"
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
                      title="Remove passenger"
                      className="p-1.5 rounded-lg border text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Passenger Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MR RAHMAN MD"
                    value={pax.name}
                    onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                    className="input-base text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Ticket Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09812345678"
                      value={pax.ticketNo}
                      onChange={(e) => handleFieldChange(index, 'ticketNo', e.target.value)}
                      className="input-base text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      PNR Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABC123"
                      value={pax.pnr}
                      onChange={(e) => handleFieldChange(index, 'pnr', e.target.value.toUpperCase())}
                      className="input-base text-sm uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Airline
                      </label>
                      {onQuickAddAirline && (
                        <button
                          type="button"
                          onClick={onQuickAddAirline}
                          className="text-[10px] text-brand-600 font-semibold"
                        >
                          + New
                        </button>
                      )}
                    </div>
                    <select
                      value={pax.airline}
                      onChange={(e) => handleFieldChange(index, 'airline', e.target.value)}
                      className="input-base text-xs cursor-pointer"
                    >
                      <option value="">Select Airline</option>
                      {airlines.map((air) => (
                        <option key={air._id} value={air._id}>
                          {air.name} {air.iataCode ? `(${air.iataCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Flight Route
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DAC-DXB"
                      value={pax.route}
                      onChange={(e) => handleFieldChange(index, 'route', e.target.value.toUpperCase())}
                      className="input-base text-xs uppercase"
                    />
                  </div>
                </div>

                {/* Quick Route Helper Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span style={{ color: 'var(--text-tertiary)' }}>Popular:</span>
                  {POPULAR_ROUTES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleFieldChange(index, 'route', r)}
                      className="px-1.5 py-0.5 rounded border transition-colors hover:bg-[var(--surface-secondary)] font-mono"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {r}
                    </button>
                  ))}
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
              <th className="py-2.5 px-2.5 min-w-[170px]">Passenger Name *</th>
              <th className="py-2.5 px-2.5 min-w-[125px]">Ticket No</th>
              <th className="py-2.5 px-2.5 min-w-[95px]">PNR</th>
              <th className="py-2.5 px-2.5 min-w-[150px]">Airline</th>
              <th className="py-2.5 px-2.5 min-w-[110px]">Route</th>
              <th className="py-2.5 px-2.5 min-w-[110px] text-right">Cost (Buy) *</th>
              <th className="py-2.5 px-2.5 min-w-[110px] text-right">Price (Sell) *</th>
              <th className="py-2.5 px-2.5 min-w-[95px] text-right">Profit</th>
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
                      placeholder="MR RAHMAN MD"
                      value={pax.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                      className="input-base text-xs font-medium"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      placeholder="09812345678"
                      value={pax.ticketNo}
                      onChange={(e) => handleFieldChange(index, 'ticketNo', e.target.value)}
                      className="input-base text-xs font-mono"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      placeholder="ABC123"
                      value={pax.pnr}
                      onChange={(e) => handleFieldChange(index, 'pnr', e.target.value.toUpperCase())}
                      className="input-base text-xs uppercase font-mono"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <div className="flex items-center gap-1">
                      <select
                        value={pax.airline}
                        onChange={(e) => handleFieldChange(index, 'airline', e.target.value)}
                        className="input-base text-xs cursor-pointer py-1.5"
                      >
                        <option value="">Select Airline</option>
                        {airlines.map((air) => (
                          <option key={air._id} value={air._id}>
                            {air.name} {air.iataCode ? `(${air.iataCode})` : ''}
                          </option>
                        ))}
                      </select>
                      {onQuickAddAirline && (
                        <button
                          type="button"
                          onClick={onQuickAddAirline}
                          title="Quick add new airline"
                          className="p-1 rounded-md text-xs transition-colors hover:bg-[var(--surface-secondary)] text-brand-600 border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      placeholder="DAC-DXB"
                      value={pax.route}
                      onChange={(e) => handleFieldChange(index, 'route', e.target.value.toUpperCase())}
                      className="input-base text-xs uppercase font-mono"
                    />
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
                        title="Duplicate fare & flight details to new row"
                        className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={passengers.length === 1}
                        onClick={() => handleRemoveRow(index)}
                        title="Remove passenger"
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
              <td colSpan="6" className="py-3 px-4 text-right uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Total Invoice Summary:
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

export default PassengerRowsTable;
