import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/clients.api.js';
import { suppliersApi } from '../api/suppliers.api.js';
import { airlinesApi } from '../api/airlines.api.js';
import { transactionsApi } from '../api/transactions.api.js';
import { Card } from '../components/ui/Card.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { SelectField } from '../components/ui/SelectField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { PassengerRowsTable } from '../components/forms/PassengerRowsTable.jsx';
import { QuickAddClientModal, QuickAddAirlineModal } from '../components/forms/QuickAddInline.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { PlaneTakeoff, Plus, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export function InvoicePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  const [passengers, setPassengers] = useState([
    { name: '', ticketNo: '', pnr: '', airline: '', route: '', cost: '', sell: '' }
  ]);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAirlineModalOpen, setIsAirlineModalOpen] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch clients, suppliers, airlines
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list({ limit: 500 })
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list({ active: true })
  });

  const { data: airlinesData } = useQuery({
    queryKey: ['airlines'],
    queryFn: airlinesApi.list
  });

  const clients = clientsData?.clients || [];
  const suppliers = suppliersData?.suppliers || [];
  const airlines = airlinesData?.airlines || [];

  const selectedClient = clients.find(c => c._id === clientId);
  const selectedSupplier = suppliers.find(s => s._id === supplierId);

  // Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: transactionsApi.createTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSuccessTx(data.transaction);
      setErrorMessage('');
      // Reset form
      setPassengers([{ name: '', ticketNo: '', pnr: '', airline: '', route: '', cost: '', sell: '' }]);
      setNotes('');
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to issue ticket invoice.');
    }
  });

  const totalBuy = passengers.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);
  const totalSell = passengers.reduce((sum, p) => sum + (Number(p.sell) || 0), 0);
  const totalProfit = totalSell - totalBuy;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMessage('Please select or add a client.');
      return;
    }
    if (!supplierId) {
      setErrorMessage('Please select a supplier.');
      return;
    }

    createInvoiceMutation.mutate({
      date,
      clientId,
      supplierId,
      passengers,
      notes
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <PlaneTakeoff className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            Issue Air Ticket Invoice
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Generate passenger ticket invoices with automated double-entry ledger & supplier balance updating.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {successTx && (
        <div
          className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border"
          style={{
            backgroundColor: 'var(--success-muted)',
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Invoice <span className="font-mono">{successTx.ref}</span> Issued Successfully!
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--success)' }}>
                Client Due updated: +BDT {formatMoney(successTx.totalSell)}. Supplier balance adjusted.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSuccessTx(null)}>
              Issue Another
            </Button>
            <Button size="sm" variant="success" onClick={() => navigate('/ledger')}>
              View in Ledger
            </Button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div
          className="rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm border"
          style={{
            backgroundColor: 'var(--danger-muted)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card title="Invoice Header Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoice Date */}
            <InputField
              label="Invoice Date *"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* Client Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Client / Customer *
                </label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus className="w-3 h-3" /> Quick Add
                </button>
              </div>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="input-base text-sm cursor-pointer"
              >
                <option value="">Select Client...</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} - Due: BDT {formatMoney(c.currentDue)}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <div className="mt-1.5 text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <span>Current Outstanding Due:</span>
                  <span className="font-bold font-mono" style={{ color: 'var(--danger)' }}>
                    BDT {formatMoney(selectedClient.currentDue)}
                  </span>
                </div>
              )}
            </div>

            {/* Supplier Picker */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Supplier / Portal / Consolidator *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="input-base text-sm cursor-pointer"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} [{s.type}] {s.isSelf ? '(In-house)' : `- Balance: BDT ${formatMoney(s.balance)}`}
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <div className="mt-1.5 text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <Badge variant={selectedSupplier.type === 'PORTAL' ? 'portal' : selectedSupplier.type === 'AGENCY' ? 'agency' : 'direct'} size="xs">
                    {selectedSupplier.type}
                  </Badge>
                  {selectedSupplier.type === 'PORTAL' && (
                    <span>Wallet Balance: <strong className="font-mono" style={{ color: 'var(--accent)' }}>BDT {formatMoney(selectedSupplier.balance)}</strong></span>
                  )}
                  {selectedSupplier.type === 'AGENCY' && (
                    <span>Current Payable: <strong className="font-mono" style={{ color: 'var(--warning)' }}>BDT {formatMoney(selectedSupplier.balance)}</strong></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Dynamic Passenger Rows */}
        <Card>
          <PassengerRowsTable
            passengers={passengers}
            airlines={airlines}
            onChange={setPassengers}
            onQuickAddAirline={() => setIsAirlineModalOpen(true)}
          />
        </Card>

        {/* Bottom Section: Notes & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card title="Remarks & Instructions">
              <textarea
                rows="3"
                placeholder="Optional notes, booking remarks, or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-base resize-none"
              />
            </Card>
          </div>

          <div>
            <div className="card p-5 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Invoice Total Summary
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Total Buying Cost:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
                    BDT {formatMoney(totalBuy)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Total Selling Price:</span>
                  <span className="font-mono font-bold text-base" style={{ color: 'var(--success)' }}>
                    BDT {formatMoney(totalSell)}
                  </span>
                </div>
                <div
                  className="pt-2 flex justify-between font-bold text-sm border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>Expected Profit:</span>
                  <span className="font-mono" style={{ color: totalProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    BDT {formatMoney(totalProfit)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  loading={createInvoiceMutation.isPending}
                  className="w-full"
                >
                  Issue Invoice & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Inline Quick Add Modals */}
      <QuickAddClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onCreated={(newClient) => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          setClientId(newClient._id);
        }}
      />

      <QuickAddAirlineModal
        isOpen={isAirlineModalOpen}
        onClose={() => setIsAirlineModalOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['airlines'] });
        }}
      />
    </div>
  );
}
