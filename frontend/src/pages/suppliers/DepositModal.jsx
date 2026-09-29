import React from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { InputField } from '../../components/ui/InputField.jsx';
import { formatMoney } from '../../utils/formatMoney.js';

export function DepositModal({
  portal,
  onClose,
  onSubmit,
  txnForm,
  setTxnForm,
  loading = false
}) {
  if (!portal) return null;

  return (
    <Modal
      isOpen={Boolean(portal)}
      onClose={onClose}
      title={`Deposit to Wallet: ${portal.name}`}
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
          <span style={{ color: 'var(--text-secondary)' }}>Current Wallet Balance:</span>
          <strong className="font-mono text-sm text-accent">
            BDT {formatMoney(portal.balance)}
          </strong>
        </div>

        <InputField
          label="Deposit Amount (BDT) *"
          type="number"
          required
          min="1"
          step="any"
          placeholder="e.g. 100000"
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
            <option value="BANK">Bank Transfer (NPSB / BEFTN / RTGS)</option>
            <option value="ONLINE">Instant Portal Top-up (Cards)</option>
            <option value="CHEQUE">Bank Cheque</option>
            <option value="CASH">Direct Cash Deposit</option>
          </select>
        </div>

        <InputField
          label="BSP Ref / Bank Trx ID"
          placeholder="e.g. BSP-2026-991"
          value={txnForm.bspRef}
          onChange={(e) => setTxnForm((prev) => ({ ...prev, bspRef: e.target.value }))}
        />

        <InputField
          label="Remarks"
          placeholder="e.g. GDS balance recharge"
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
          <Button type="submit" loading={loading}>
            Save Deposit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
