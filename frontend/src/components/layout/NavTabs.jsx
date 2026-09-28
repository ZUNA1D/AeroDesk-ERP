import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  LayoutDashboard,
  PlaneTakeoff,
  Stamp,
  Receipt,
  BookOpen,
  Building2,
  FileSpreadsheet,
  Settings,
  Users,
  History,
  Crown
} from 'lucide-react';
import { clsx } from 'clsx';

export function NavTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navItems = [
    ...(isSuperAdmin ? [
      { to: '/agencies', label: 'Tenants & Licensing', icon: Crown }
    ] : []),
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/invoice', label: 'Issue Tickets', icon: PlaneTakeoff },
    { to: '/visa', label: 'Visa Invoice', icon: Stamp },
    { to: '/receipts', label: 'Receipts', icon: Receipt },
    { to: '/ledger', label: 'Ledger', icon: BookOpen },
    { to: '/suppliers', label: 'Portals & Agencies', icon: Building2 },
    { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
    { to: '/settings', label: 'Settings', icon: Settings },
    ...(isAdmin ? [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/audit-log', label: 'Audit Log', icon: History }
    ] : [])
  ];

  return (
    <nav
      className="border-b sticky top-16 z-30 backdrop-blur-md"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? '#ffffff' : 'var(--text-secondary)'
                })}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
