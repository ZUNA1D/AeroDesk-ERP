import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agencyApi } from '../api/agency.api.js';
import {
  Building2,
  Users,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  PowerOff,
  Power,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  Crown
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { SelectField } from '../components/ui/SelectField.jsx';

export function AgenciesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingAgency, setEditingAgency] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'ACTIVE',
    subscriptionPlan: 'GROWTH',
    maxUsers: 15
  });
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Fetch all agencies across the platform
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['superadmin-agencies'],
    queryFn: () => agencyApi.getAllAgencies()
  });

  const agencies = data?.agencies || [];

  // Mutation to update agency status, plan, max users
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => agencyApi.updateAgencyStatus(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['superadmin-agencies']);
      setEditingAgency(null);
      setFeedbackMsg(res.message || 'Agency updated successfully.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to update agency');
    }
  });

  // KPI Calculations
  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter(a => a.status === 'ACTIVE').length;
  const suspendedAgencies = agencies.filter(a => a.status === 'SUSPENDED').length;
  const totalUsersAcrossPlatform = agencies.reduce((acc, a) => acc + (a.stats?.users || 0), 0);
  const totalTxsAcrossPlatform = agencies.reduce((acc, a) => acc + (a.stats?.txs || 0), 0);

  // Filtering
  const filteredAgencies = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.owner?.name && a.owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.owner?.email && a.owner.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (agency) => {
    setEditingAgency(agency);
    setEditForm({
      status: agency.status || 'ACTIVE',
      subscriptionPlan: agency.subscriptionPlan || 'GROWTH',
      maxUsers: agency.maxUsers || 15
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingAgency) return;
    updateMutation.mutate({
      id: editingAgency._id,
      payload: {
        status: editForm.status,
        subscriptionPlan: editForm.subscriptionPlan,
        maxUsers: Number(editForm.maxUsers)
      }
    });
  };

  const handleToggleKillswitch = (agency) => {
    const newStatus = agency.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const actionVerb = newStatus === 'SUSPENDED' ? 'SUSPEND' : 'REACTIVATE';
    const confirmPrompt = window.confirm(
      `Are you sure you want to ${actionVerb} agency workspace "${agency.name}" (${agency.slug})?\n\n` +
      (newStatus === 'SUSPENDED'
        ? 'All staff and administrators of this agency will be instantly locked out!'
        : 'Access will be immediately restored.')
    );
    if (!confirmPrompt) return;

    updateMutation.mutate({
      id: agency._id,
      payload: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
            >
              <Crown className="w-3.5 h-3.5" />
              Platform Owner Control
            </span>
            {isFetching && (
              <span className="text-[11px] animate-pulse" style={{ color: 'var(--text-tertiary)' }}>
                Syncing...
              </span>
            )}
          </div>
          <h1
            className="text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Multi-Tenant Agency Directory & Control
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Oversee tenant workspaces, manage subscription licensing, adjust staff quotas, and execute instant killswitch controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            icon={RefreshCw}
            className={isFetching ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className="p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in"
          style={{
            backgroundColor: 'var(--success-muted)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            color: 'var(--success)'
          }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agencies"
          value={totalAgencies}
          icon={Building2}
          color="accent"
          description="Registered travel agencies"
        />
        <StatCard
          title="Active Workspaces"
          value={activeAgencies}
          icon={ShieldCheck}
          color="success"
          description={`${suspendedAgencies} currently suspended`}
        />
        <StatCard
          title="Total Platform Users"
          value={totalUsersAcrossPlatform}
          icon={Users}
          color="warning"
          description="Staff & admin accounts"
        />
        <StatCard
          title="Transactions Processed"
          value={totalTxsAcrossPlatform}
          icon={CreditCard}
          color="accent"
          description="Tickets, visas & receipts"
        />
      </div>

      {/* Controls Bar */}
      <div className="card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            className="input-base pl-9 text-xs w-full"
            placeholder="Search by agency name, slug, email, or admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                backgroundColor: statusFilter === st ? 'var(--accent)' : 'var(--surface-secondary)',
                color: statusFilter === st ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Agencies Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b font-semibold uppercase tracking-wider text-[11px]"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <th className="py-3 px-4">Agency / Workspace</th>
                <th className="py-3 px-4">Owner / Admin</th>
                <th className="py-3 px-4 text-center">Plan Tier</th>
                <th className="py-3 px-4 text-center">User Capacity</th>
                <th className="py-3 px-4 text-center">Telemetry</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Killswitch / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                    Loading agency workspaces...
                  </td>
                </tr>
              ) : filteredAgencies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10" style={{ color: 'var(--text-tertiary)' }}>
                    No agency workspaces found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAgencies.map((agency) => {
                  const isSuspended = agency.status === 'SUSPENDED';
                  const userCount = agency.stats?.users || 0;
                  const maxQuota = agency.maxUsers || 15;
                  const usagePct = Math.min(Math.round((userCount / maxQuota) * 100), 100);

                  return (
                    <tr
                      key={agency._id}
                      className="transition-colors hover:bg-[var(--surface-secondary)]"
                      style={{ opacity: isSuspended ? 0.75 : 1 }}
                    >
                      {/* Name & Slug */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {agency.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="font-mono text-[11px] px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--hover)',
                              color: 'var(--accent)'
                            }}
                          >
                            {agency.slug}.aerodesk.app
                          </span>
                        </div>
                        {agency.address && (
                          <div className="text-[11px] mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {agency.address}
                          </div>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {agency.owner?.name || 'Administrator'}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          {agency.owner?.email || agency.email}
                        </div>
                        {agency.phone && (
                          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            {agency.phone}
                          </div>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase"
                          style={{
                            backgroundColor:
                              agency.subscriptionPlan === 'ENTERPRISE'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : agency.subscriptionPlan === 'GROWTH'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(100, 116, 139, 0.15)',
                            color:
                              agency.subscriptionPlan === 'ENTERPRISE'
                                ? '#a855f7'
                                : agency.subscriptionPlan === 'GROWTH'
                                ? '#3b82f6'
                                : '#64748b'
                          }}
                        >
                          {agency.subscriptionPlan || 'GROWTH'}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                          {userCount} / {maxQuota} Users
                        </div>
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${usagePct}%`,
                              backgroundColor: usagePct >= 90 ? 'var(--danger)' : 'var(--accent)'
                            }}
                          />
                        </div>
                      </td>

                      {/* Telemetry */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-bold">{agency.stats?.clients || 0}</span> Clients
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="font-bold">{agency.stats?.txs || 0}</span> Transactions
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              agency.status === 'ACTIVE'
                                ? 'var(--success-muted)'
                                : agency.status === 'SUSPENDED'
                                ? 'var(--danger-muted)'
                                : 'var(--warning-muted)',
                            color:
                              agency.status === 'ACTIVE'
                                ? 'var(--success)'
                                : agency.status === 'SUSPENDED'
                                ? 'var(--danger)'
                                : 'var(--warning)'
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                agency.status === 'ACTIVE'
                                  ? 'var(--success)'
                                  : agency.status === 'SUSPENDED'
                                  ? 'var(--danger)'
                                  : 'var(--warning)'
                            }}
                          />
                          {agency.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEdit(agency)}
                            icon={Edit2}
                            title="Edit Plan & Seats"
                          >
                            Plan
                          </Button>

                          {/* Killswitch Button */}
                          <button
                            onClick={() => handleToggleKillswitch(agency)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
                            style={{
                              backgroundColor: isSuspended ? 'var(--success-muted)' : 'var(--danger-muted)',
                              borderColor: isSuspended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                              color: isSuspended ? 'var(--success)' : 'var(--danger)'
                            }}
                            title={isSuspended ? 'Reactivate agency workspace' : 'Killswitch: Suspend agency workspace'}
                          >
                            {isSuspended ? (
                              <>
                                <Power className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Agency Plan & Quota Modal */}
      <Modal
        isOpen={Boolean(editingAgency)}
        onClose={() => setEditingAgency(null)}
        title={`Configure Agency: ${editingAgency?.name}`}
        subtitle={`Workspace ID: ${editingAgency?.slug}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <SelectField
            label="Account Status"
            value={editForm.status}
            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE - Full Normal Access' },
              { value: 'TRIAL', label: 'TRIAL - Evaluation Workspace' },
              { value: 'SUSPENDED', label: 'SUSPENDED - Immediate Lockout (Killswitch)' }
            ]}
          />

          <SelectField
            label="Subscription Plan Tier"
            value={editForm.subscriptionPlan}
            onChange={(e) => setEditForm(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
            options={[
              { value: 'STARTER', label: 'STARTER Plan' },
              { value: 'GROWTH', label: 'GROWTH Plan' },
              { value: 'ENTERPRISE', label: 'ENTERPRISE Plan' }
            ]}
          />

          <InputField
            label="User Seat Quota (Max Staff Users)"
            type="number"
            min="1"
            max="1000"
            value={editForm.maxUsers}
            onChange={(e) => setEditForm(prev => ({ ...prev, maxUsers: e.target.value }))}
            hint="The agency admin will be blocked from registering staff beyond this number."
          />

          <div className="pt-3 flex items-center justify-end gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingAgency(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={updateMutation.isPending}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default AgenciesPage;
