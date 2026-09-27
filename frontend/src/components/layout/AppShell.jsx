import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';
import { SidebarProvider } from '../../context/SidebarContext.jsx';

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
          <footer
            className="py-3 border-t text-center text-[11px] px-4"
            style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
          >
            AeroDesk ERP • Travel & Aviation Management System
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
