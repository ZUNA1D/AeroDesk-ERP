import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api.js';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { InputField } from '../components/ui/InputField.jsx';
import { Users, UserPlus, Shield, CheckCircle, XCircle, AlertCircle, Mail, Key } from 'lucide-react';

export function UsersPage() {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF'
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list
  });

  const users = usersData?.users || [];

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'STAFF' });
      setErrorMessage('');
    },
    onError: (err) => setErrorMessage(err.message)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: usersApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => setErrorMessage(err.message)
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            User Accounts & Role Permissions
          </h2>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage agency staff, accountants, and administrators with role-based access control.
          </p>
        </div>

        <Button icon={UserPlus} onClick={() => setIsAddModalOpen(true)}>
          Add User Account
        </Button>
      </div>

      {errorMessage && (
        <div
          className="p-3.5 rounded-xl text-xs sm:text-sm border flex items-center gap-2.5"
          style={{
            backgroundColor: 'var(--danger-muted)',
            borderColor: 'rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)'
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="uppercase text-[11px] font-semibold tracking-wider border-b"
              style={{
                backgroundColor: 'var(--table-header-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-tertiary)'
              }}
            >
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="divide-y font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-3.5 px-4 font-semibold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: 'var(--accent-muted)',
                          color: 'var(--accent)',
                          border: '1px solid var(--ring)'
                        }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.role === 'ADMIN' ? 'purple' : u.role === 'MANAGER' ? 'primary' : 'neutral'} size="xs">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.active ? 'active' : 'voided'} size="xs">
                        {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={u.active ? 'outline' : 'success'}
                        onClick={() => toggleStatusMutation.mutate(u._id)}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New User Account"
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUserMutation.mutate(form);
            }}
            className="space-y-4"
          >
            <InputField
              label="Full Name *"
              required
              placeholder="e.g. Tariq Ahmed"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              autoFocus
            />

            <InputField
              label="Email Address *"
              type="email"
              required
              placeholder="agent@aerodesk.com"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            />

            <InputField
              label="Temporary Password *"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Role Permission *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                className="input-base text-sm cursor-pointer"
              >
                <option value="STAFF">Counter Staff (Create Invoices & Receipts)</option>
                <option value="MANAGER">Manager / Accountant (Delete & View Reports)</option>
                <option value="ADMIN">Administrator (Full Access & Recalculation)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createUserMutation.isPending}>
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
