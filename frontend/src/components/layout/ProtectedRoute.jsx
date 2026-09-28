import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, setupRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
          Loading Session...
        </span>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (allowedRoles.includes('SUPER_ADMIN')) {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
