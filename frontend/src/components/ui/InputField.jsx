import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const InputField = React.forwardRef(function InputField({
  label,
  error,
  icon: Icon,
  hint,
  className,
  containerClassName,
  ...props
}, ref) {
  return (
    <div className={twMerge(clsx('w-full', containerClassName))}>
      {label && (
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'input-base',
              Icon && 'pl-10',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
              className
            )
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      ) : null}
    </div>
  );
});
