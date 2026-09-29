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

export function getNavGroups(user) {
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (isSuperAdmin) {
    return [
      {
        label: 'Platform Administration',
        items: [
          { to: '/agencies', label: 'Tenants & Licensing', icon: Crown },
          { to: '/audit-log', label: 'Global Audit Trail', icon: History }
        ]
      }
    ];
  }

  return [
    {
      label: 'Main',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: 'Transactions',
      items: [
        { to: '/invoice', label: 'Issue Tickets', icon: PlaneTakeoff },
        { to: '/visa', label: 'Visa Invoice', icon: Stamp },
        { to: '/receipts', label: 'Receipts', icon: Receipt }
      ]
    },
    {
      label: 'Finance',
      items: [
        { to: '/ledger', label: 'Ledger', icon: BookOpen },
        { to: '/suppliers', label: 'Portals & Agencies', icon: Building2 },
        { to: '/reports', label: 'Reports', icon: FileSpreadsheet }
      ]
    },
    {
      label: 'System',
      items: [
        { to: '/settings', label: 'Settings', icon: Settings },
        ...(isAdmin
          ? [
              { to: '/users', label: 'Users', icon: Users },
              { to: '/audit-log', label: 'Audit Log', icon: History }
            ]
          : [])
      ]
    }
  ];
}
