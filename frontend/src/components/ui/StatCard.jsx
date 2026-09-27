import React from 'react';
import { clsx } from 'clsx';
import { formatMoney } from '../../utils/formatMoney.js';

export function StatCard({
  title,
  value,
  currency = 'BDT',
  icon: Icon,
  variant = 'blue',
  subtitle,
  changeText,
  onClick
}) {
  const variantConfig = {
    blue: {
      iconColor: '#3b82f6',
      iconBg: 'var(--accent-muted)',
      valueColor: 'var(--accent)',
      chipBg: 'var(--accent-muted)',
      chipText: 'var(--accent)',
      accentBorder: 'var(--accent)',
    },
    green: {
      iconColor: '#10b981',
      iconBg: 'var(--success-muted)',
      valueColor: 'var(--success)',
      chipBg: 'var(--success-muted)',
      chipText: 'var(--success)',
      accentBorder: 'var(--success)',
    },
    red: {
      iconColor: '#ef4444',
      iconBg: 'var(--danger-muted)',
      valueColor: 'var(--danger)',
      chipBg: 'var(--danger-muted)',
      chipText: 'var(--danger)',
      accentBorder: 'var(--danger)',
    },
    amber: {
      iconColor: '#f59e0b',
      iconBg: 'var(--warning-muted)',
      valueColor: 'var(--warning)',
      chipBg: 'var(--warning-muted)',
      chipText: 'var(--warning)',
      accentBorder: 'var(--warning)',
    },
    // Keep backward compat with old variant names
    sky: undefined,
    emerald: undefined,
    rose: undefined,
  };

  // Map old variant names to new
  const mappedVariant = variant === 'sky' ? 'blue'
    : variant === 'emerald' ? 'green'
    : variant === 'rose' ? 'red'
    : variant;

  const config = variantConfig[mappedVariant] || variantConfig.blue;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'card relative overflow-hidden p-5 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-elevated'
      )}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: config.accentBorder, opacity: 0.5 }}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {title}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {currency}
            </span>
            <span
              className="text-2xl font-bold tracking-tight font-mono"
              style={{ color: config.valueColor }}
            >
              {formatMoney(value)}
            </span>
          </div>
        </div>
        {Icon && (
          <div
            className="p-2.5 rounded-lg"
            style={{
              backgroundColor: config.iconBg,
              color: config.iconColor,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || changeText) && (
        <div
          className="mt-3 flex items-center justify-between text-xs pt-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>{subtitle}</span>
          {changeText && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
              style={{
                backgroundColor: config.chipBg,
                color: config.chipText,
              }}
            >
              {changeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
