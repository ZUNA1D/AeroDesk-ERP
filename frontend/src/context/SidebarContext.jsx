import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sal-sidebar-collapsed');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sal-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      setIsCollapsed,
      isMobileOpen,
      setIsMobileOpen,
      toggle,
      closeMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
