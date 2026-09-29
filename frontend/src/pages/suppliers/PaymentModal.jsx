import React from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { InputField } from '../../components/ui/InputField.jsx';
import { formatMoney } from '../../utils/formatMoney.js';

export function PaymentModal({
  agency,
  onClose,
  onSubmit,
  txnForm,
  setTxnForm,
  loading = false
}) {
  if (!agency) return null;

  return (
    <Modal
      isOpen={Boolean(agency)}
      onClose={onClose}
      title={`Pay Consolidator: ${agency.name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div
          className="p-3 rounded-xl text-xs flex justify-between items-center border"
          style={{
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Current Payable Due:</span>
          <strong className="font-mono text-sm text-warning">
            BDT {formatMoney(agency.balance)}
          </strong>
        </div>

        <InputField
          label="Payment Amount (BDT) *"
          type="number"
          required
          min="1"
          step="any"
          placeholder="e.g. 50000"
          value={txnForm.amount}
          onChange={(e) => setTxnForm((prev) => ({ ...prev, amount: e.target.value }))}
          autoFocus
        />

        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Payment Channel
          </label>
          <select
            value={txnForm.mode}
            onChange={(e) => setTxnForm((prev) => ({ ...prev, mode: e.target.value }))}
            className="input-base text-sm cursor-pointer"
          >
            <option value="BANK">Bank Transfer</option>
            <option value="CHEQUE">Bank Cheque</option>
            <option value="CASH">Cash Payment</option>
          </select>
        </div>

        <InputField
          label="Remarks / Reference"
          placeholder="e.g. Settled invoice batch 12"
          value={txnForm.remarks}
          onChange={(e) => setTxnForm((prev) => ({ ...prev, remarks: e.target.value }))}
        />

        <div
          className="flex justify-end gap-2 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="warning" loading={loading}>
            Save Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
