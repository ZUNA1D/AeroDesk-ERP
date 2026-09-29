import React from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { InputField } from '../../components/ui/InputField.jsx';
import { AlertTriangle } from 'lucide-react';

export function VoidModal({
  tx,
  onClose,
  onSubmit,
  reason,
  setReason,
  loading = false
}) {
  if (!tx) return null;

  return (
    <Modal
      isOpen={Boolean(tx)}
      onClose={onClose}
      title={`Void Transaction: ${tx.ref}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div
          className="p-3.5 rounded-xl border flex items-start gap-3"
          style={{
            backgroundColor: 'var(--danger-muted)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)'
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold block mb-0.5">Warning: Immutable Audit Action</span>
            Voiding will create reverse ledger entries and restore balances for client{' '}
            <strong>{tx.client?.name || 'N/A'}</strong> and supplier{' '}
            <strong>{tx.supplier?.name || 'N/A'}</strong>.
          </div>
        </div>

        <InputField
          label="Reason for Voiding *"
          required
          placeholder="e.g. Passenger cancelled before ticket issuance"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />

        <div
          className="flex justify-end gap-2 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={loading} disabled={!reason.trim()}>
            Confirm Void
          </Button>
        </div>
      </form>
    </Modal>
  );
}
