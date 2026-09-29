import React from 'react';
import { clsx } from 'clsx';
import { formatMoney } from '../../utils/formatMoney.js';

export function SummaryGrid({ items = [], currency = 'BDT', className }) {
  const variantStyles = {
    blue: {
      bg: 'var(--accent-muted)',
      border: 'var(--accent)',
      text: 'var(--accent)',
    },
    green: {
      bg: 'var(--success-muted)',
      border: 'var(--success)',
      text: 'var(--success)',
    },
    red: {
      bg: 'var(--danger-muted)',
      border: 'var(--danger)',
      text: 'var(--danger)',
    },
    amber: {
      bg: 'var(--warning-muted)',
      border: 'var(--warning)',
      text: 'var(--warning)',
    },
    neutral: {
      bg: 'var(--surface-secondary)',
      border: 'var(--border)',
      text: 'var(--text-primary)',
    }
  };

  return (
    <div className={clsx('grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
      {items.map((item, idx) => {
        const style = variantStyles[item.variant || 'neutral'];
        return (
          <div
            key={idx}
            className="card p-3.5 sm:p-4 border relative overflow-hidden"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ backgroundColor: style.border }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block truncate"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {item.label}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {item.currency || currency}
              </span>
              <span
                className="text-lg sm:text-xl font-bold font-mono tracking-tight truncate"
                style={{ color: style.text }}
              >
                {typeof item.value === 'number' ? formatMoney(item.value) : item.value || '0.00'}
              </span>
            </div>
            {item.subtext && (
              <span
                className="text-[10px] block mt-1 truncate"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {item.subtext}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
