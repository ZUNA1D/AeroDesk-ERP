import React from 'react';
import { Plane } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md animate-pulse">
          <Plane className="w-5 h-5 -rotate-45" />
        </div>
      </div>
      <span className="text-xs font-medium mt-3" style={{ color: 'var(--text-tertiary)' }}>
        Loading workspace module...
      </span>
    </div>
  );
}
