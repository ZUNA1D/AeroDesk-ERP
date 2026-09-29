import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

export function PasswordField({
  label = 'Password',
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  error,
  hint,
  id,
  name = 'password',
  autoComplete = 'current-password',
  className,
  disabled = false
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-[11px] font-medium transition-colors inline-flex items-center gap-1 hover:opacity-80"
          style={{ color: 'var(--text-tertiary)' }}
          tabIndex={-1}
        >
          {showPassword ? (
            <>
              <EyeOff className="w-3 h-3" /> Hide
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" /> Show
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Lock className="w-4 h-4" />
        </div>
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={clsx('input-base pl-10', error && 'border-danger focus:ring-danger/20')}
        />
      </div>

      {error && (
        <p className="text-xs text-danger mt-1 animate-fade-in">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      )}
    </div>
  );
}
