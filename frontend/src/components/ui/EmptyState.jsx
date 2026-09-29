import React from 'react';
import { Inbox } from 'lucide-react';
import { clsx } from 'clsx';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action,
  className
}) {
  return (
    <div
      className={clsx(
        'card p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-fade-in',
        className
      )}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105"
        style={{
          backgroundColor: 'var(--accent-muted)',
          color: 'var(--accent)'
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3
        className="text-base font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p
        className="text-xs sm:text-sm mt-1.5 max-w-sm leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
