import React from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { InputField } from '../../components/ui/InputField.jsx';

export function SupplierFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  isEdit = false,
  loading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Supplier' : 'Add New Supplier'}
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Supplier / Consolidator Name *"
          required
          placeholder="e.g. GALILEO B2B WALLET / AIR TRIP"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
          autoFocus
        />

        {!isEdit && (
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Supplier Category *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'PORTAL' }))}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  formData.type === 'PORTAL'
                    ? 'border-accent bg-accent/10'
                    : 'border-theme-border bg-surface-secondary'
                }`}
              >
                <span
                  className="font-bold text-xs block"
                  style={{ color: formData.type === 'PORTAL' ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  Booking Portal
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  BSP / GDS Prepaid Wallet
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'AGENCY' }))}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  formData.type === 'AGENCY'
                    ? 'border-warning bg-warning/10'
                    : 'border-theme-border bg-surface-secondary'
                }`}
              >
                <span
                  className="font-bold text-xs block"
                  style={{ color: formData.type === 'AGENCY' ? 'var(--warning)' : 'var(--text-primary)' }}
                >
                  Agency / Consolidator
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Credit line with payables
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            label="Contact Person"
            placeholder="e.g. Key Account Manager"
            value={formData.contactPerson}
            onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
          />
          <InputField
            label="Phone Number"
            placeholder="+880 1711..."
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        <InputField
          label="Email Address"
          type="email"
          placeholder="support@portal.com"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />

        {formData.type === 'AGENCY' && (
          <InputField
            label="Credit Limit (BDT)"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 500000"
            value={formData.creditLimit}
            onChange={(e) => setFormData((prev) => ({ ...prev, creditLimit: e.target.value }))}
            hint="System will warn if outstanding payable crosses this amount."
          />
        )}

        <div
          className="flex justify-end gap-2 pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
