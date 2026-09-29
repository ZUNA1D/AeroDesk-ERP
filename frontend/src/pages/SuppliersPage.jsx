import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers.api.js';
import { transactionsApi } from '../api/transactions.api.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { PortalsList } from './suppliers/PortalsList.jsx';
import { AgenciesList } from './suppliers/AgenciesList.jsx';
import { SupplierFormModal } from './suppliers/SupplierFormModal.jsx';
import { DepositModal } from './suppliers/DepositModal.jsx';
import { PaymentModal } from './suppliers/PaymentModal.jsx';
import { Building2, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function SuppliersPage() {
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PORTAL' | 'AGENCY'

  // Modals
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [topUpPortal, setTopUpPortal] = useState(null);
  const [payAgency, setPayAgency] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, supplier: null });

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

  // Fetch suppliers
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.list()
  });

  const suppliers = suppliersData?.suppliers || [];
  const portals = suppliers.filter((s) => s.type === 'PORTAL');
  const agencies = suppliers.filter((s) => s.type === 'AGENCY');
  const directStock = suppliers.find((s) => s.isSelf || s.type === 'DIRECT');

  const totalPortalBalance = portals.reduce((sum, p) => sum + (p.balance || 0), 0);
  const totalAgencyDue = agencies.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddSupplierModalOpen(false);
      setSupplierForm({ name: '', type: 'PORTAL', contactPerson: '', phone: '', email: '', creditLimit: '' });
      toast.success(`Supplier "${res?.supplier?.name || 'created'}" registered successfully.`);
    },
    onError: (err) => toast.error(err.message || 'Failed to create supplier')
  });

  // Update Supplier Mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setEditSupplier(null);
      toast.success('Supplier details updated successfully.');
    },
    onError: (err) => toast.error(err.message || 'Failed to update supplier')
  });

  // Delete Supplier Mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteConfirm({ isOpen: false, supplier: null });
      toast.success('Supplier removed successfully.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete supplier');
      setDeleteConfirm({ isOpen: false, supplier: null });
    }
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
      toast.success('Supplier transaction recorded.');
    },
    onError: (err) => toast.error(err.message || 'Transaction failed')
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

  const handleDeleteRequest = (supplier) => {
    setDeleteConfirm({ isOpen: true, supplier });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5"
            style={{ color: 'var(--text-primary)' }}
          >
            <Building2 className="w-6 h-6 text-accent" />
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

      {/* In-House Stock Banner */}
      {directStock && (
        <div
          className="card p-4 flex items-center justify-between gap-3 border"
          style={{
            borderColor: 'rgba(59, 130, 246, 0.25)',
            backgroundColor: 'var(--surface)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center bg-accent-muted border-accent/20 text-accent"
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {directStock.name}
                </span>
                <Badge variant="direct" size="xs">DIRECT / OWN STOCK</Badge>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                In-house ticketing inventory with zero liability tracking.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-1.5 border-b pb-1"
        style={{ borderColor: 'var(--border)' }}
      >
        {[
          { key: 'ALL', label: `All Suppliers (${suppliers.length})` },
          { key: 'PORTAL', label: `Booking Portals (${portals.length})` },
          { key: 'AGENCY', label: `Consolidators (${agencies.length})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              activeFilter === tab.key
                ? 'bg-accent/10 border-accent text-accent'
                : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary hover:bg-surface-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(activeFilter === 'ALL' || activeFilter === 'PORTAL') && (
          <div className={activeFilter === 'PORTAL' ? 'lg:col-span-2' : ''}>
            <PortalsList
              portals={portals}
              totalBalance={totalPortalBalance}
              isLoading={isLoading}
              onTopUp={(portal) => {
                setTopUpPortal(portal);
                setTxnForm({ amount: '', mode: 'BANK', remarks: '', bspRef: '' });
              }}
              onEdit={(portal) => setEditSupplier(portal)}
              onDelete={handleDeleteRequest}
            />
          </div>
        )}

        {(activeFilter === 'ALL' || activeFilter === 'AGENCY') && (
          <div className={activeFilter === 'AGENCY' ? 'lg:col-span-2' : ''}>
            <AgenciesList
              agencies={agencies}
              totalDue={totalAgencyDue}
              isLoading={isLoading}
              onPay={(agency) => {
                setPayAgency(agency);
                setTxnForm({ amount: '', mode: 'BANK', remarks: '' });
              }}
              onEdit={(agency) => setEditSupplier(agency)}
              onDelete={handleDeleteRequest}
            />
          </div>
        )}
      </div>

      {/* Modal: Add Supplier */}
      <SupplierFormModal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          createSupplierMutation.mutate(supplierForm);
        }}
        formData={supplierForm}
        setFormData={setSupplierForm}
        loading={createSupplierMutation.isPending}
      />

      {/* Modal: Edit Supplier */}
      {editSupplier && (
        <SupplierFormModal
          isOpen={Boolean(editSupplier)}
          onClose={() => setEditSupplier(null)}
          onSubmit={(e) => {
            e.preventDefault();
            updateSupplierMutation.mutate({
              id: editSupplier._id,
              data: {
                name: editSupplier.name,
                contactPerson: editSupplier.contactPerson,
                phone: editSupplier.phone,
                email: editSupplier.email,
                creditLimit: editSupplier.creditLimit
              }
            });
          }}
          formData={editSupplier}
          setFormData={setEditSupplier}
          isEdit
          loading={updateSupplierMutation.isPending}
        />
      )}

      {/* Modal: Deposit to Portal */}
      <DepositModal
        portal={topUpPortal}
        onClose={() => setTopUpPortal(null)}
        onSubmit={handleDepositSubmit}
        txnForm={txnForm}
        setTxnForm={setTxnForm}
        loading={createTxnMutation.isPending}
      />

      {/* Modal: Pay Agency */}
      <PaymentModal
        agency={payAgency}
        onClose={() => setPayAgency(null)}
        onSubmit={handlePaymentSubmit}
        txnForm={txnForm}
        setTxnForm={setTxnForm}
        loading={createTxnMutation.isPending}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, supplier: null })}
        onConfirm={() => deleteSupplierMutation.mutate(deleteConfirm.supplier?._id)}
        loading={deleteSupplierMutation.isPending}
        title={`Delete Supplier "${deleteConfirm.supplier?.name}"?`}
        message={`Are you sure you want to delete ${deleteConfirm.supplier?.name}? This action cannot be undone.`}
        confirmText="Delete Supplier"
        variant="danger"
      />
    </div>
  );
}

export default SuppliersPage;
