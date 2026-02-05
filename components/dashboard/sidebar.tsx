'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Calendar,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { OrganizationSwitcher } from '@/components/organization/organization-switcher';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Rooms',
    href: '/dashboard/rooms',
    icon: DoorOpen,
  },
  {
    label: 'Bookings',
    href: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    label: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: FileText,
  },
  {
    label: 'Expenses',
    href: '/dashboard/expenses',
    icon: DollarSign,
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-white flex flex-col min-h-screen transition-transform duration-300 z-40",
        "lg:w-64 lg:relative lg:translate-x-0",
        "fixed w-64 top-0 left-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo/Brand */}
        <div className="p-4 lg:p-6 border-b border-slate-700 mt-12 lg:mt-0">
          <h1 className="text-lg lg:text-xl font-bold">{businessName}</h1>
          <p className="text-xs text-slate-400">Powerd by : 9TAILED ERP SYSTEMS</p>
        </div>

        {/* Organization Switcher */}
      <OrganizationSwitcher />

      {/* Navigation Menu */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout Button */}
        <div className="p-3 lg:p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm lg:text-base"
          >
            <LogOut className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
