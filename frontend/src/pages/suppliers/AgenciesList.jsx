import React from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { formatMoney } from '../../utils/formatMoney.js';
import { Building, ArrowUpRight, Edit2, Trash2, Phone, Mail, User, CreditCard } from 'lucide-react';

export function AgenciesList({
  agencies = [],
  totalDue = 0,
  isLoading,
  onPay,
  onEdit,
  onDelete
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--warning-muted)', color: 'var(--warning)' }}
          >
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Consolidator Agencies (Credit)
            </h3>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Payable supplier credit lines
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] block" style={{ color: 'var(--text-tertiary)' }}>
            Total Outstanding Payable
          </span>
          <span className="font-mono font-bold text-sm text-warning">
            BDT {formatMoney(totalDue)}
          </span>
        </div>
      </div>

      {isLoading && <TableSkeleton rows={4} cols={3} />}

      {!isLoading && agencies.length === 0 && (
        <EmptyState
          icon={Building}
          title="No Agencies Found"
          description="Add your consolidators and ticketing agencies to track credit lines and payable dues."
        />
      )}

      <div className="space-y-3">
        {agencies.map((agency) => (
          <div
            key={agency._id}
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
                    {agency.name}
                  </h4>
                  <Badge variant="amber" size="xs">CREDIT LINE</Badge>
                  {agency.creditLimit > 0 && agency.balance >= agency.creditLimit && (
                    <Badge variant="danger" size="xs">LIMIT EXCEEDED</Badge>
                  )}
                </div>

                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Outstanding Due:
                  </span>
                  <span
                    className={`font-mono text-base font-bold ${
                      agency.balance > 0 ? 'text-warning' : 'text-success'
                    }`}
                  >
                    BDT {formatMoney(agency.balance)}
                  </span>
                  {agency.creditLimit > 0 && (
                    <span className="text-[11px] ml-2 text-theme-text-tertiary">
                      / Limit: BDT {formatMoney(agency.creditLimit)}
                    </span>
                  )}
                </div>

                <div
                  className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {agency.contactPerson && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {agency.contactPerson}
                    </span>
                  )}
                  {agency.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {agency.phone}
                    </span>
                  )}
                  {agency.email && (
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      {agency.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  size="xs"
                  variant="warning"
                  icon={ArrowUpRight}
                  onClick={() => onPay(agency)}
                >
                  Pay Due
                </Button>
                <button
                  type="button"
                  onClick={() => onEdit(agency)}
                  className="p-2 rounded-lg transition-colors text-theme-text-tertiary hover:text-theme-text-primary hover:bg-surface-secondary"
                  title="Edit Supplier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!agency.isSelf && (
                  <button
                    type="button"
                    onClick={() => onDelete(agency)}
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
