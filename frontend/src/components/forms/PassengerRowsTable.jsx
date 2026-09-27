import React from 'react';
import { Plus, Trash2, User, Ticket, Plane, MapPin } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { formatMoney } from '../../utils/formatMoney.js';

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
          Passenger & Ticket Details ({passengers.length} Pax)
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
              <th className="py-3 px-3 min-w-[160px]">Passenger Name *</th>
              <th className="py-3 px-3 min-w-[130px]">Ticket No</th>
              <th className="py-3 px-3 min-w-[100px]">PNR</th>
              <th className="py-3 px-3 min-w-[150px]">Airline</th>
              <th className="py-3 px-3 min-w-[110px]">Route</th>
              <th className="py-3 px-3 min-w-[110px] text-right">Cost (Buy) *</th>
              <th className="py-3 px-3 min-w-[110px] text-right">Price (Sell) *</th>
              <th className="py-3 px-3 min-w-[100px] text-right">Profit</th>
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
                      placeholder="e.g. MR RAHMAN MD"
                      value={pax.name}
                      onChange={(e) => handleFieldChange(index, 'name', e.target.value.toUpperCase())}
                      className="input-base text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="e.g. 09812345678"
                      value={pax.ticketNo}
                      onChange={(e) => handleFieldChange(index, 'ticketNo', e.target.value)}
                      className="input-base text-xs"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="e.g. ABC123"
                      value={pax.pnr}
                      onChange={(e) => handleFieldChange(index, 'pnr', e.target.value.toUpperCase())}
                      className="input-base text-xs uppercase"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
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
                      {onQuickAddAirline && (
                        <button
                          type="button"
                          onClick={onQuickAddAirline}
                          title="Quick add new airline"
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
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      placeholder="e.g. DAC-JED-DAC"
                      value={pax.route}
                      onChange={(e) => handleFieldChange(index, 'route', e.target.value.toUpperCase())}
                      className="input-base text-xs uppercase"
                    />
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
              <td colSpan="6" className="py-3 px-4 text-right uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
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
