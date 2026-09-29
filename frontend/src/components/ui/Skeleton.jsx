import React from 'react';
import { clsx } from 'clsx';

export function SkeletonBlock({ className, style }) {
  return (
    <div
      className={clsx('skeleton rounded-md', className)}
      style={style}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6, className }) {
  return (
    <div className={clsx('card overflow-hidden', className)}>
      <div
        className="p-4 border-b flex items-center gap-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--table-header-bg)' }}
      >
        {[...Array(cols)].map((_, i) => (
          <SkeletonBlock key={i} className="h-4 flex-1 max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {[...Array(rows)].map((_, r) => (
          <div key={r} className="p-4 flex items-center gap-4">
            {[...Array(cols)].map((_, c) => (
              <SkeletonBlock
                key={c}
                className="h-3.5 flex-1"
                style={{ width: c === 0 ? '30%' : c === cols - 1 ? '15%' : 'auto' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 4, className }) {
  return (
    <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonBlock className="h-7 w-32" />
          <div className="pt-2 border-t flex justify-between" style={{ borderColor: 'var(--border)' }}>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
