import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({ children, variant = 'neutral', size = 'sm', className }) {
  const getVariantStyles = () => {
    const variants = {
      neutral: {
        backgroundColor: 'var(--badge-neutral-bg)',
        color: 'var(--badge-neutral-text)',
        borderColor: 'var(--badge-neutral-border)',
      },
      primary: {
        backgroundColor: 'var(--accent-muted)',
        color: 'var(--accent)',
        borderColor: 'transparent',
      },
      success: {
        backgroundColor: 'var(--success-muted)',
        color: 'var(--success)',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: 'var(--danger-muted)',
        color: 'var(--danger)',
        borderColor: 'transparent',
      },
      warning: {
        backgroundColor: 'var(--warning-muted)',
        color: 'var(--warning)',
        borderColor: 'transparent',
      },
      purple: {
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        color: '#8b5cf6',
        borderColor: 'transparent',
      },
      portal: {
        backgroundColor: 'var(--accent-muted)',
        color: 'var(--accent)',
        borderColor: 'transparent',
      },
      agency: {
        backgroundColor: 'var(--warning-muted)',
        color: 'var(--warning)',
        borderColor: 'transparent',
      },
      direct: {
        backgroundColor: 'var(--badge-neutral-bg)',
        color: 'var(--badge-neutral-text)',
        borderColor: 'var(--badge-neutral-border)',
      },
      active: {
        backgroundColor: 'var(--success-muted)',
        color: 'var(--success)',
        borderColor: 'transparent',
      },
      voided: {
        backgroundColor: 'var(--danger-muted)',
        color: 'var(--danger)',
        borderColor: 'transparent',
      },
    };
    return variants[variant] || variants.neutral;
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 font-medium',
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 rounded-md border tracking-wide uppercase',
          sizes[size],
          variant === 'voided' && 'line-through',
          className
        )
      )}
      style={getVariantStyles()}
    >
      {children}
    </span>
  );
}

export function Pill({ label, value, variant = 'neutral' }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ color: 'var(--text-tertiary)' }}>{label}:</span>
      <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{value}</span>
    </span>
  );
}
