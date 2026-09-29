import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'primary-btn focus-visible:ring-brand-400',
    secondary: 'border shadow-sm hover:shadow focus-visible:ring-brand-400',
    accent: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm focus-visible:ring-brand-400',
    success: 'text-white shadow-sm focus-visible:ring-emerald-400',
    danger: 'text-white shadow-sm focus-visible:ring-red-400',
    warning: 'text-white shadow-sm focus-visible:ring-amber-400',
    ghost: 'focus-visible:ring-brand-400',
    outline: 'border bg-transparent focus-visible:ring-brand-400',
  };

  // Use inline styles for theme-aware coloring
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        };
      case 'success':
        return { backgroundColor: 'var(--success)', color: 'white' };
      case 'danger':
        return { backgroundColor: 'var(--danger)', color: 'white' };
      case 'warning':
        return { backgroundColor: 'var(--warning)', color: 'white' };
      case 'ghost':
        return { color: 'var(--text-secondary)' };
      case 'outline':
        return {
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        };
      default:
        return {};
    }
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2',
  };

  return (
    <button
      disabled={disabled || loading}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      style={getVariantStyle()}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      ) : null}
      {children}
    </button>
  );
}
