import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { Wallet, ArrowDownRight, Edit2, Trash2, Phone, Mail, User } from 'lucide-react';

export function PortalsList({
  portals = [],
  totalBalance = 0,
  isLoading,
  onTopUp,
  onEdit,
  onDelete
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
          >
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Booking Portals (Wallets)
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Prepaid balance accounts
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] block" style={{ color: 'var(--text-tertiary)' }}>
            Total Available Funds
          </span>
          <span className="font-mono font-bold text-sm text-accent">
            BDT {formatMoney(totalBalance)}
          </span>
        </div>
      </div>

      {isLoading && <TableSkeleton rows={4} cols={3} />}

      {!isLoading && portals.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No Portals Found"
          description="Add your BSP or GDS booking portal wallets to track prepaid balances."
        />
      )}

      <div className="space-y-3">
        {portals.map((portal) => (
          <div
            key={portal._id}
            className="card p-4 border transition-all duration-200 hover:shadow-card group"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {portal.name}
                  </h4>
                  <Badge variant="blue" size="xs">PORTAL WALLET</Badge>
                  {portal.balance < 10000 && (
                    <Badge variant="amber" size="xs">LOW BALANCE</Badge>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Available Balance:
                  </span>
                  <span
                    className={`font-mono text-base font-bold ${
                      portal.balance > 0 ? 'text-accent' : 'text-danger'
                    }`}
                  >
                    BDT {formatMoney(portal.balance)}
                  </span>
                </div>

                <div
                  className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {portal.contactPerson && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {portal.contactPerson}
                    </span>
                  )}
                  {portal.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {portal.phone}
                    </span>
                  )}
                  {portal.email && (
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {portal.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onTopUp(portal)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(portal)}
                  className="p-2 rounded-lg transition-colors text-theme-text-tertiary hover:text-theme-text-primary hover:bg-surface-secondary"
                  title="Edit Supplier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!portal.isSelf && (
                  <button
                    type="button"
                    onClick={() => onDelete(portal)}
                    className="p-2 rounded-lg transition-colors text-theme-text-tertiary hover:text-danger hover:bg-danger-muted"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
