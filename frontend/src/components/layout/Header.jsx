import React from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSidebar } from '../../context/SidebarContext.jsx';
import { Menu, LogOut, Moon, Sun, ChevronDown } from 'lucide-react';

export function Header() {
  const { user, settings, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { toggle } = useSidebar();

  const companyName = settings?.companyName || 'AeroDesk';
  const logoUrl = settings?.logoUrl;

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl border-b h-14 flex items-center"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={toggle}
            className="lg:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-[var(--sidebar-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Company branding */}
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl.startsWith('http') ? logoUrl : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${logoUrl}`}
                alt="Logo"
                className="h-8 w-auto object-contain max-w-[120px]"
              />
            ) : null}
            <div className="hidden sm:block">
              <h1
                className="text-sm font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {companyName}
              </h1>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {settings?.tagline || 'Travel & Aviation Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--sidebar-hover)]"
            style={{ color: 'var(--text-secondary)' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* User profile */}
          {user && (
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--surface-secondary)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {user.role}
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--danger-muted)]"
            style={{ color: 'var(--text-tertiary)' }}
            title="Log out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
