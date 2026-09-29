import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../api/clients.api.js';
import { transactionsApi } from '../api/transactions.api.js';
import { Card } from '../components/ui/Card.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { QuickAddClientModal } from '../components/forms/QuickAddInline.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import { numberToWords } from '../utils/numberToWords.js';
import { openPrintDocument } from '../utils/print.js';
import { Receipt, Plus, CheckCircle, Printer, AlertTriangle } from 'lucide-react';

export function ReceiptsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('CASH');
  const [bankName, setBankName] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: clientsData } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list({ limit: 500 }) });
  const clients = clientsData?.clients || [];
  const selectedClient = clients.find(c => c._id === clientId);

  const createReceiptMutation = useMutation({
    mutationFn: transactionsApi.createReceipt,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSuccessReceipt(data.transaction);
      setErrorMessage('');
      setAmount(''); setRemarks(''); setChequeNo(''); setTransactionId('');
    },
    onError: (err) => setErrorMessage(err.message || 'Failed to record money receipt.')
  });

  const numAmount = Number(amount) || 0;
  const wordsRepresentation = numberToWords(numAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) { setErrorMessage('Please select a client.'); return; }
    if (numAmount <= 0) { setErrorMessage('Receipt amount must be greater than zero.'); return; }
    createReceiptMutation.mutate({
      date, clientId, amount: numAmount, mode,
      bankName: mode === 'BANK' ? bankName : undefined,
      chequeNo: mode === 'BANK' ? chequeNo : undefined,
      transactionId: (mode === 'MOBILE' || mode === 'CARD') ? transactionId : undefined,
      remarks
    });
  };

  const handlePrintVoucher = (txId) => {
    if (!txId) return;
    openPrintDocument(`/transactions/${txId}/receipt-pdf`);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Receipt className="w-5 h-5" style={{ color: 'var(--success)' }} />
          Money Receipt & Client Collection
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Record cash/bank collections to reduce client dues and generate printable Money Receipt vouchers.
        </p>
      </div>

      {successReceipt && (
        <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border" style={{ backgroundColor: 'var(--success-muted)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--success)' }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Receipt <span className="font-mono">{successReceipt.ref}</span> Saved!
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--success)' }}>
                Received BDT {formatMoney(successReceipt.amount)} via {successReceipt.mode}. Client due successfully reduced.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" icon={Printer} onClick={() => handlePrintVoucher(successReceipt._id)}>Print Voucher</Button>
            <Button size="sm" variant="secondary" onClick={() => setSuccessReceipt(null)}>New Receipt</Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm border" style={{ backgroundColor: 'var(--danger-muted)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card title="Payment Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Receipt Date *" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Client / Party Name *</label>
                  <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    <Plus className="w-3 h-3" /> Quick Add
                  </button>
                </div>
                <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="input-base text-sm cursor-pointer">
                  <option value="">Select Client...</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name} {c.phone ? `(${c.phone})` : ''} - Due: BDT {formatMoney(c.currentDue)}</option>)}
                </select>
                {selectedClient && (
                  <div className="mt-2 p-2.5 rounded-lg border text-xs space-y-1" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedClient.name}</span>
                      <span className="font-mono font-bold text-rose-600">Current Due: BDT {formatMoney(selectedClient.currentDue)}</span>
                    </div>
                    {numAmount > 0 && (
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                        <span>Remaining Due After Payment:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          BDT {formatMoney(Math.max(0, selectedClient.currentDue - numAmount))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Amount Received (BDT) *" type="number" required min="1" step="any" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-bold font-mono" style={{ color: 'var(--success)' }} />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Payment Mode *</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="input-base text-sm cursor-pointer">
                  <option value="CASH">CASH (Hand Cash)</option>
                  <option value="BANK">BANK (Transfer / Cheque)</option>
                  <option value="MOBILE">MOBILE (bKash / Nagad)</option>
                  <option value="CARD">CARD (POS)</option>
                </select>
              </div>
            </div>

            {/* Lakh / Crore Live Preview */}
            <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border)' }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Amount in Words (Bangladeshi Lakh/Crore):</div>
              <div className="text-sm font-medium italic" style={{ color: 'var(--accent)' }}>"{wordsRepresentation}"</div>
            </div>

            {mode === 'BANK' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <InputField label="Bank Name" placeholder="e.g. Islami Bank Bangladesh / City Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <InputField label="Cheque / Deposit Slip No" placeholder="e.g. CHQ-998811" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} />
              </div>
            )}

            {(mode === 'MOBILE' || mode === 'CARD') && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <InputField label="Transaction TrxID / Approval Code" placeholder="e.g. 9J8811AA" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Particulars / Remarks</label>
              <input type="text" placeholder="e.g. Advance payment for Umrah ticket / Partial due clearance" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="input-base" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" size="lg" loading={createReceiptMutation.isPending} className="w-full sm:w-auto px-8">
              Save Receipt & Generate Voucher
            </Button>
          </div>
        </Card>
      </form>

      <QuickAddClientModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onCreated={(newClient) => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setClientId(newClient._id); }} />
    </div>
  );
}
