import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers.api.js';
import { transactionsApi } from '../api/transactions.api.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { formatMoney } from '../utils/formatMoney.js';
import {
  Building2,
  Wallet,
  Building,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Phone,
  User,
  ShieldCheck,
  CreditCard,
  Mail,
  AlertCircle
} from 'lucide-react';

export function SuppliersPage() {
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PORTAL' | 'AGENCY'

  // Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [topUpPortal, setTopUpPortal] = useState(null);
  const [payAgency, setPayAgency] = useState(null);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    type: 'PORTAL',
    contactPerson: '',
    phone: '',
    email: '',
    creditLimit: ''
  });

  const [txnForm, setTxnForm] = useState({
    amount: '',
    mode: 'BANK',
    remarks: '',
    bspRef: ''
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list()
  });

  const suppliers = suppliersData?.suppliers || [];

  const portals = suppliers.filter(s => s.type === 'PORTAL');
  const agencies = suppliers.filter(s => s.type === 'AGENCY');
  const directStock = suppliers.find(s => s.isSelf || s.type === 'DIRECT');

  const totalPortalBalance = portals.reduce((sum, p) => sum + (p.balance || 0), 0);
  const totalAgencyDue = agencies.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddSupplierModalOpen(false);
      setSupplierForm({ name: '', type: 'PORTAL', contactPerson: '', phone: '', email: '', creditLimit: '' });
      setErrorMessage('');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  // Update Supplier Mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      setErrorMessage('');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  // Delete Supplier Mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setErrorMessage('');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  // Supplier Transaction Mutation (Deposit / Payment)
  const createTxnMutation = useMutation({
    mutationFn: transactionsApi.createSupplierTxn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setTopUpPortal(null);
      setPayAgency(null);
      setTxnForm({ amount: '', mode: 'BANK', remarks: '', bspRef: '' });
      setErrorMessage('');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!topUpPortal) return;
    createTxnMutation.mutate({
      supplierId: topUpPortal._id,
      amount: Number(txnForm.amount),
      type: 'SUPPLIER_DEPOSIT',
      subtype: 'DEPOSIT',
      mode: txnForm.mode,
      remarks: txnForm.remarks,
      bspRef: txnForm.bspRef
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!payAgency) return;
    createTxnMutation.mutate({
      supplierId: payAgency._id,
      amount: Number(txnForm.amount),
      type: 'SUPPLIER_PAYMENT',
      subtype: 'PAYMENT',
      mode: txnForm.mode,
      remarks: txnForm.remarks
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Building2 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            Portals & Agencies (Suppliers)
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage prepaid BSP/GDS booking portal wallets, consolidator credit accounts, and direct inventory stock.
          </p>
        </div>

        <Button
          icon={Plus}
          onClick={() => {
            setSupplierForm({ name: '', type: 'PORTAL', contactPerson: '', phone: '', email: '', creditLimit: '' });
            setIsAddSupplierModalOpen(true);
          }}
        >
          Add New Supplier
        </Button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div
          className="p-4 rounded-xl text-xs sm:text-sm border flex items-center gap-3"
          style={{
            backgroundColor: 'var(--danger-muted)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)'
          }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* In-House Stock Banner */}
      {directStock && (
        <div
          className="card p-4 flex items-center justify-between gap-3 border"
          style={{
            borderColor: 'rgba(59, 130, 246, 0.25)',
            background: 'linear-gradient(to right, var(--surface), var(--surface-secondary))'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-muted)',
                borderColor: 'var(--ring)',
                color: 'var(--accent)'
              }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{directStock.name}</span>
                <Badge variant="direct" size="xs">DIRECT / OWN STOCK</Badge>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                In-house ticketing inventory with zero liability tracking.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="card p-4 flex items-center justify-between"
          style={{ borderLeft: '4px solid var(--accent)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Prepaid Portals & BSP ({portals.length})
              </div>
              <div className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                BDT {formatMoney(totalPortalBalance)}
              </div>
            </div>
          </div>
          <Badge variant="portal" size="sm">Available Funds</Badge>
        </div>

        <div
          className="card p-4 flex items-center justify-between"
          style={{ borderLeft: '4px solid var(--warning)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--warning-muted)', color: 'var(--warning)' }}
            >
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Consolidators & Agencies ({agencies.length})
              </div>
              <div className="text-xl font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                BDT {formatMoney(totalAgencyDue)}
              </div>
            </div>
          </div>
          <Badge variant="agency" size="sm">Total Payable</Badge>
        </div>
      </div>

      {/* Two-Column Grid: Portals vs. Agencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Prepaid Portal Wallets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Prepaid Portals & BSP</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  borderColor: 'var(--ring)',
                  color: 'var(--accent)'
                }}
              >
                {portals.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {portals.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                No prepaid portals added yet.
              </div>
            ) : (
              portals.map((portal) => (
                <div
                  key={portal._id}
                  className="card p-5 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{portal.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {portal.contactPerson && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> {portal.contactPerson}
                          </span>
                        )}
                        {portal.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> {portal.phone}
                          </span>
                        )}
                        {portal.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> {portal.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant="portal" size="xs">
                      WALLET
                    </Badge>
                  </div>

                  <div
                    className="flex items-end justify-between pt-3 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold block" style={{ color: 'var(--text-tertiary)' }}>
                        Wallet Balance:
                      </span>
                      <span className="text-xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
                        BDT {formatMoney(portal.balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={ArrowUpRight}
                        onClick={() => setTopUpPortal(portal)}
                      >
                        Top-up Wallet
                      </Button>
                      <button
                        onClick={() => setEditSupplier(portal)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!portal.isSelf && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${portal.name}?`)) {
                              deleteSupplierMutation.mutate(portal._id);
                            }
                          }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--danger)';
                            e.currentTarget.style.backgroundColor = 'var(--danger-muted)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Running Agencies (Credit Lines) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" style={{ color: 'var(--warning)' }} />
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Consolidators & Agencies</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: 'var(--warning-muted)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  color: 'var(--warning)'
                }}
              >
                {agencies.length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {agencies.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                No consolidator agencies added yet.
              </div>
            ) : (
              agencies.map((agency) => (
                <div
                  key={agency._id}
                  className="card p-5 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{agency.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {agency.contactPerson && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> {agency.contactPerson}
                          </span>
                        )}
                        {agency.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> {agency.phone}
                          </span>
                        )}
                        {agency.creditLimit > 0 && (
                          <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>
                            Limit: BDT {formatMoney(agency.creditLimit)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge variant="agency" size="xs">
                      CREDIT LINE
                    </Badge>
                  </div>

                  <div
                    className="flex items-end justify-between pt-3 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold block" style={{ color: 'var(--text-tertiary)' }}>
                        Current Payable:
                      </span>
                      <span className="text-xl font-bold font-mono" style={{ color: 'var(--warning)' }}>
                        BDT {formatMoney(agency.balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="warning"
                        icon={ArrowDownRight}
                        onClick={() => setPayAgency(agency)}
                      >
                        Pay Agency
                      </Button>
                      <button
                        onClick={() => setEditSupplier(agency)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.backgroundColor = 'var(--surface-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${agency.name}?`)) {
                            deleteSupplierMutation.mutate(agency._id);
                          }
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--danger)';
                          e.currentTarget.style.backgroundColor = 'var(--danger-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Top-up Portal Wallet */}
      {topUpPortal && (
        <Modal
          isOpen={Boolean(topUpPortal)}
          onClose={() => setTopUpPortal(null)}
          title={`Top-up Wallet: ${topUpPortal.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div
              className="p-3 rounded-xl text-xs flex justify-between items-center"
              style={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>
              <strong className="font-mono text-sm" style={{ color: 'var(--accent)' }}>BDT {formatMoney(topUpPortal.balance)}</strong>
            </div>

            <InputField
              label="Deposit Amount (BDT) *"
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 100000"
              value={txnForm.amount}
              onChange={(e) => setTxnForm(prev => ({ ...prev, amount: e.target.value }))}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Payment Channel
              </label>
              <select
                value={txnForm.mode}
                onChange={(e) => setTxnForm(prev => ({ ...prev, mode: e.target.value }))}
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
              onChange={(e) => setTxnForm(prev => ({ ...prev, bspRef: e.target.value }))}
            />

            <InputField
              label="Remarks"
              placeholder="e.g. GDS balance recharge"
              value={txnForm.remarks}
              onChange={(e) => setTxnForm(prev => ({ ...prev, remarks: e.target.value }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setTopUpPortal(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={createTxnMutation.isPending}>
                Save Deposit
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Pay Agency */}
      {payAgency && (
        <Modal
          isOpen={Boolean(payAgency)}
          onClose={() => setPayAgency(null)}
          title={`Pay Consolidator: ${payAgency.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div
              className="p-3 rounded-xl text-xs flex justify-between items-center"
              style={{ backgroundColor: 'var(--surface-secondary)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Current Payable Due:</span>
              <strong className="font-mono text-sm" style={{ color: 'var(--warning)' }}>BDT {formatMoney(payAgency.balance)}</strong>
            </div>

            <InputField
              label="Payment Amount (BDT) *"
              type="number"
              required
              min="1"
              step="any"
              placeholder="e.g. 50000"
              value={txnForm.amount}
              onChange={(e) => setTxnForm(prev => ({ ...prev, amount: e.target.value }))}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Payment Channel
              </label>
              <select
                value={txnForm.mode}
                onChange={(e) => setTxnForm(prev => ({ ...prev, mode: e.target.value }))}
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
              onChange={(e) => setTxnForm(prev => ({ ...prev, remarks: e.target.value }))}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setPayAgency(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="warning" loading={createTxnMutation.isPending}>
                Save Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Add Supplier */}
      {isAddSupplierModalOpen && (
        <Modal
          isOpen={isAddSupplierModalOpen}
          onClose={() => setIsAddSupplierModalOpen(false)}
          title="Add New Supplier"
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createSupplierMutation.mutate(supplierForm);
            }}
            className="space-y-4"
          >
            <InputField
              label="Supplier / Consolidator Name *"
              required
              placeholder="e.g. GALILEO B2B WALLET / AIR TRIP"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Supplier Type *
              </label>
              <select
                value={supplierForm.type}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, type: e.target.value }))}
                className="input-base text-sm cursor-pointer"
              >
                <option value="PORTAL">PORTAL (Prepaid BSP / GDS Wallet)</option>
                <option value="AGENCY">AGENCY (Credit Line / Consolidator Payable)</option>
              </select>
            </div>

            <InputField
              label="Contact Person"
              placeholder="e.g. Mr. Rafiqul Islam"
              value={supplierForm.contactPerson}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Phone"
                placeholder="+880 1700..."
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
              />
              <InputField
                label="Email"
                type="email"
                placeholder="support@..."
                value={supplierForm.email}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            {supplierForm.type === 'AGENCY' && (
              <InputField
                label="Credit Limit (BDT)"
                type="number"
                placeholder="e.g. 500000"
                value={supplierForm.creditLimit}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, creditLimit: e.target.value }))}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsAddSupplierModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createSupplierMutation.isPending}>
                Create Supplier
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Supplier */}
      {editSupplier && (
        <Modal
          isOpen={Boolean(editSupplier)}
          onClose={() => setEditSupplier(null)}
          title={`Edit Supplier: ${editSupplier.name}`}
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSupplierMutation.mutate({ id: editSupplier._id, data: editSupplier });
            }}
            className="space-y-4"
          >
            <InputField
              label="Supplier Name *"
              required
              value={editSupplier.name}
              onChange={(e) => setEditSupplier(prev => ({ ...prev, name: e.target.value }))}
            />
            <InputField
              label="Contact Person"
              value={editSupplier.contactPerson || ''}
              onChange={(e) => setEditSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
            />
            <InputField
              label="Phone"
              value={editSupplier.phone || ''}
              onChange={(e) => setEditSupplier(prev => ({ ...prev, phone: e.target.value }))}
            />
            <InputField
              label="Email"
              value={editSupplier.email || ''}
              onChange={(e) => setEditSupplier(prev => ({ ...prev, email: e.target.value }))}
            />
            {editSupplier.type === 'AGENCY' && (
              <InputField
                label="Credit Limit (BDT)"
                type="number"
                value={editSupplier.creditLimit || ''}
                onChange={(e) => setEditSupplier(prev => ({ ...prev, creditLimit: e.target.value }))}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditSupplier(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateSupplierMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
