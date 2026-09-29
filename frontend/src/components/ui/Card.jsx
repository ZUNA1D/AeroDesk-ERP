import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className, title, subtitle, action, footer, hover = false, ...props }) {
  return (
    <div
      className={twMerge(
        clsx(
          'card transition-all duration-200',
          hover && 'hover:shadow-elevated cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div
          className="px-4 sm:px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            {title && (
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div
          className="px-5 py-3 border-t rounded-b-xl"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface-secondary)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
