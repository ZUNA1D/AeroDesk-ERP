import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useSidebar } from '../../context/SidebarContext.jsx';
import { clsx } from 'clsx';
import {
  Plane,
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
  ChevronsLeft,
  ChevronsRight,
  Crown,
  X
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navGroups = isSuperAdmin
    ? [
        {
          label: 'Platform Administration',
          items: [
            { to: '/agencies', label: 'Tenants & Licensing', icon: Crown },
            { to: '/audit-log', label: 'Global Audit Trail', icon: History }
          ]
        }
      ]
    : [
        {
          label: 'Main',
          items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ]
        },
        {
          label: 'Transactions',
          items: [
            { to: '/invoice', label: 'Issue Tickets', icon: PlaneTakeoff },
            { to: '/visa', label: 'Visa Invoice', icon: Stamp },
            { to: '/receipts', label: 'Receipts', icon: Receipt },
          ]
        },
        {
          label: 'Finance',
          items: [
            { to: '/ledger', label: 'Ledger', icon: BookOpen },
            { to: '/suppliers', label: 'Portals & Agencies', icon: Building2 },
            { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
          ]
        },
        {
          label: 'System',
          items: [
            { to: '/settings', label: 'Settings', icon: Settings },
            ...(isAdmin ? [
              { to: '/users', label: 'Users', icon: Users },
              { to: '/audit-log', label: 'Audit Log', icon: History },
            ] : []),
          ]
        },
      ];

  const renderSidebarContent = (collapsed = false) => (
    <div className="flex flex-col h-full">
      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative',
                      isActive
                        ? 'font-semibold'
                        : 'hover:bg-[var(--sidebar-hover)]'
                    )}
                    style={{
                      backgroundColor: isActive ? 'var(--sidebar-active)' : undefined,
                      color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                    <Icon className={clsx(
                      'flex-shrink-0 transition-colors',
                      collapsed ? 'w-5 h-5' : 'w-4 h-4'
                    )} />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div
        className="hidden lg:flex items-center justify-center p-3 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--sidebar-hover)]"
          style={{ color: 'var(--text-tertiary)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <ChevronsLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 sidebar-transition lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Mobile header */}
        <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${
                isSuperAdmin ? 'bg-amber-600' : 'bg-brand-600'
              }`}
            >
              {isSuperAdmin ? <Crown className="w-4 h-4" /> : <Plane className="w-4 h-4 -rotate-45" />}
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight" style={{ color: 'var(--text-primary)' }}>
                {isSuperAdmin ? 'AeroDesk Master' : 'AeroDesk'}
              </span>
              {isSuperAdmin && (
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  Platform Owner
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--sidebar-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderSidebarContent(false)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 sidebar-transition overflow-hidden'
        )}
        style={{
          width: isCollapsed ? '68px' : '240px',
          minWidth: isCollapsed ? '68px' : '240px',
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Desktop branding */}
        <div
          className="h-14 flex items-center px-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                isSuperAdmin ? 'bg-amber-600' : 'bg-brand-600'
              }`}
            >
              {isSuperAdmin ? <Crown className="w-4 h-4" /> : <Plane className="w-4 h-4 -rotate-45" />}
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <div className="font-bold text-sm tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                  {isSuperAdmin ? 'AeroDesk Master' : 'AeroDesk'}
                </div>
                {isSuperAdmin && (
                  <div className="text-[10px] font-bold text-[#eab308] uppercase tracking-wider mt-0.5">
                    Platform Owner
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {renderSidebarContent(isCollapsed)}
      </aside>
    </>
  );
}
