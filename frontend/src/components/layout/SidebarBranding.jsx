import React from 'react';
import { Crown, Plane } from 'lucide-react';
import { clsx } from 'clsx';

export function SidebarBranding({ isSuperAdmin, collapsed = false, className }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div
        className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 transition-colors',
          isSuperAdmin ? 'bg-amber-600' : 'bg-brand-600'
        )}
      >
        {isSuperAdmin ? <Crown className="w-4 h-4" /> : <Plane className="w-4 h-4 -rotate-45" />}
      </div>
      {!collapsed && (
        <div className="animate-fade-in truncate">
          <span
            className="font-bold text-sm tracking-tight block leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {isSuperAdmin ? 'AeroDesk Master' : 'AeroDesk'}
          </span>
          {isSuperAdmin && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--super-admin)' }}
            >
              Platform Owner
            </span>
          )}
        </div>
      )}
    </div>
  );
}
