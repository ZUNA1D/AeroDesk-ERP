import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api.js';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { History, Shield, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function AuditLogPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const limit = 30;

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, action, page],
    queryFn: () => auditApi.list({ entityType, action, page, limit })
  });

  const logs = auditData?.logs || [];
  const pagination = auditData?.pagination || { total: 0, page: 1, pages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
          <History className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          System Audit Trail & Compliance Log
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Immutable event log of every create, update, void, and delete operation performed across the system.
        </p>
      </div>

      {/* Filter */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              className="input-base text-sm cursor-pointer"
            >
              <option value="">All Entities</option>
              <option value="Transaction">Transactions</option>
              <option value="Client">Clients</option>
              <option value="Supplier">Suppliers</option>
              <option value="User">Users</option>
              <option value="Settings">Settings / Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Action Type
            </label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="input-base text-sm cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="VOID">VOID</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
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
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody
              className="divide-y font-medium"
              style={{ borderColor: 'var(--border)' }}
            >
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    Loading audit history...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="py-3 px-4 whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>
                        {log.performedBy?.name || 'System / Setup'}
                      </span>
                      {log.performedBy?.email && (
                        <span className="text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>
                          {log.performedBy.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          log.action === 'CREATE' ? 'success' :
                          log.action === 'VOID' ? 'voided' :
                          log.action === 'DELETE' ? 'danger' : 'primary'
                        }
                        size="xs"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: 'var(--accent)' }}>
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                      {log.details || 'Operation completed.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
        <div>
          Showing {logs.length} of {pagination.total} audit events
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="px-2 font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
