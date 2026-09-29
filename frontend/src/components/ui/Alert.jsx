import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export function Alert({
  variant = 'error',
  title,
  message,
  children,
  onClose,
  className
}) {
  const configs = {
    error: {
      bg: 'var(--danger-muted)',
      color: 'var(--danger)',
      border: 'rgba(239, 68, 68, 0.2)',
      icon: XCircle,
    },
    success: {
      bg: 'var(--success-muted)',
      color: 'var(--success)',
      border: 'rgba(16, 185, 129, 0.2)',
      icon: CheckCircle,
    },
    warning: {
      bg: 'var(--warning-muted)',
      color: 'var(--warning)',
      border: 'rgba(245, 158, 11, 0.2)',
      icon: AlertTriangle,
    },
    info: {
      bg: 'var(--info-muted)',
      color: 'var(--info)',
      border: 'rgba(139, 92, 246, 0.2)',
      icon: Info,
    }
  };

  const config = configs[variant] || configs.error;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={clsx(
        'rounded-xl p-3.5 flex items-start gap-3 text-xs border transition-all animate-fade-in',
        className
      )}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
        color: config.color,
      }}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 leading-relaxed">
        {title && <span className="font-semibold block mb-0.5">{title}</span>}
        {message || children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors -mr-1 -mt-1"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
