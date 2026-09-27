import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const SelectField = React.forwardRef(function SelectField({
  label,
  error,
  options = [],
  children,
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
      <select
        ref={ref}
        className={twMerge(
          clsx(
            'input-base cursor-pointer',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            className
          )
        )}
        {...props}
      >
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      ) : null}
    </div>
  );
});
