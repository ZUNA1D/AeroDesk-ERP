import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { SetupPage } from './pages/SetupPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { InvoicePage } from './pages/InvoicePage.jsx';
import { VisaPage } from './pages/VisaPage.jsx';
import { ReceiptsPage } from './pages/ReceiptsPage.jsx';
import { LedgerPage } from './pages/LedgerPage.jsx';
import { SuppliersPage } from './pages/SuppliersPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { UsersPage } from './pages/UsersPage.jsx';
import { AuditLogPage } from './pages/AuditLogPage.jsx';

function HomeRoute() {
  const { user, loading, setupRequired } = useAuth();
  if (loading) {
    return null;
  }
  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />
  },
  {
    path: '/welcome',
    element: <LandingPage />
  },
  {
    path: '/landing',
    element: <LandingPage />
  },
  {
    path: '/signup',
    element: <RegisterPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/setup',
    element: <SetupPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />
      },
      {
        path: '/invoice',
        element: <InvoicePage />
      },
      {
        path: '/visa',
        element: <VisaPage />
      },
      {
        path: '/receipts',
        element: <ReceiptsPage />
      },
      {
        path: '/ledger',
        element: <LedgerPage />
      },
      {
        path: '/suppliers',
        element: <SuppliersPage />
      },
      {
        path: '/reports',
        element: <ReportsPage />
      },
      {
        path: '/settings',
        element: <SettingsPage />
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsersPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/audit-log',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AuditLogPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
