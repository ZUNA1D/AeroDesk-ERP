import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { PageLoader } from './components/common/PageLoader.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

import { LandingPage } from './pages/LandingPage.jsx';

const SetupPage = React.lazy(() => import('./pages/SetupPage.jsx').then((m) => ({ default: m.default || m.SetupPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage.jsx').then((m) => ({ default: m.default || m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage.jsx').then((m) => ({ default: m.default || m.RegisterPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.jsx').then((m) => ({ default: m.default || m.DashboardPage })));
const InvoicePage = React.lazy(() => import('./pages/InvoicePage.jsx').then((m) => ({ default: m.default || m.InvoicePage })));
const VisaPage = React.lazy(() => import('./pages/VisaPage.jsx').then((m) => ({ default: m.default || m.VisaPage })));
const ReceiptsPage = React.lazy(() => import('./pages/ReceiptsPage.jsx').then((m) => ({ default: m.default || m.ReceiptsPage })));
const LedgerPage = React.lazy(() => import('./pages/LedgerPage.jsx').then((m) => ({ default: m.default || m.LedgerPage })));
const SuppliersPage = React.lazy(() => import('./pages/SuppliersPage.jsx').then((m) => ({ default: m.default || m.SuppliersPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage.jsx').then((m) => ({ default: m.default || m.ReportsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx').then((m) => ({ default: m.default || m.SettingsPage })));
const UsersPage = React.lazy(() => import('./pages/UsersPage.jsx').then((m) => ({ default: m.default || m.UsersPage })));
const AuditLogPage = React.lazy(() => import('./pages/AuditLogPage.jsx').then((m) => ({ default: m.default || m.AuditLogPage })));
const AgenciesPage = React.lazy(() => import('./pages/AgenciesPage.jsx').then((m) => ({ default: m.default || m.AgenciesPage })));

function SuspenseWrapper({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function HomeRoute() {
  const { user, loading, setupRequired } = useAuth();
  if (loading) {
    return <PageLoader />;
  }
  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/agencies" replace />;
    }
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
    path: '/signup',
    element: (
      <SuspenseWrapper>
        <RegisterPage />
      </SuspenseWrapper>
    )
  },
  {
    path: '/register',
    element: <Navigate to="/signup" replace />
  },
  {
    path: '/setup',
    element: (
      <SuspenseWrapper>
        <SetupPage />
      </SuspenseWrapper>
    )
  },
  {
    path: '/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    )
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
        element: (
          <ProtectedRoute agencyOnly>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/invoice',
        element: (
          <ProtectedRoute agencyOnly>
            <InvoicePage />
          </ProtectedRoute>
        )
      },
      {
        path: '/visa',
        element: (
          <ProtectedRoute agencyOnly>
            <VisaPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/receipts',
        element: (
          <ProtectedRoute agencyOnly>
            <ReceiptsPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/ledger',
        element: (
          <ProtectedRoute agencyOnly>
            <LedgerPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/suppliers',
        element: (
          <ProtectedRoute agencyOnly>
            <SuppliersPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute agencyOnly>
            <ReportsPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute agencyOnly>
            <SettingsPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']} agencyOnly>
            <UsersPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/audit-log',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AuditLogPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/agencies',
        element: (
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AgenciesPage />
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

export default router;
