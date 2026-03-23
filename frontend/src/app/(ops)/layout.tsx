"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, 
  Users, 
  Building2, 
  Bell, 
  CheckSquare, 
  Calculator,
  Search,
  Star,
  Target,
  TrendingUp,
  Banknote,
  LogOut,
  ChevronRight,
  FolderOpen,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Package
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear auth cookie:', err);
    }

    logout();
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Supply Chain', href: '/supply-chain', icon: Package },
    { name: 'Accounting', href: '/accounting', icon: Calculator },
    { name: 'Accounts Payable', href: '/ap', icon: Building2 },
    { name: 'Accounts Receivable', href: '/ar', icon: Users },
    { name: 'Cash Flow', href: '/cashflow', icon: TrendingUp },
    { name: 'Payroll', href: '/payroll', icon: Banknote },
    { name: 'CRM', href: '/crm', icon: TrendingUp },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Employee Directory', href: '/hris', icon: Users },
    { name: 'Onboarding', href: '/hris/onboarding', icon: ChevronRight },
    { name: 'Performance', href: '/hr/performance', icon: Star },
    { name: 'Strategy & OKRs', href: '/strategy/okr/explorer', icon: Target },
    { name: 'Contracts', href: '/strategy/clm/registry', icon: ShieldCheck },
    { name: 'Compliance', href: '/strategy/compliance/dashboard', icon: ClipboardCheck },
    { name: 'Recruitment', href: '/hr/ats', icon: Search },
    { name: 'Org Chart', href: '/hris/org-chart', icon: LayoutDashboard },
    { name: 'Documents', href: '/dms', icon: FolderOpen },
    { name: 'QA & NCR', href: '/qa', icon: ShieldAlert },
    { name: 'Portfolio', href: '/portfolio/roadmap', icon: BarChart3 },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-body">
      {/* Mini Sidebar */}
      <aside className="w-16 md:w-64 bg-brand-navy border-r border-white/5 flex flex-col transition-all duration-300 relative z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-brand-gold/20">
            <Building2 size={18} className="text-brand-navy" />
          </div>
          <span className="font-heading text-white font-bold hidden md:block truncate">
            {user?.firstName ? `${user.firstName}'s OS` : 'CompanyOS'}
          </span>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-brand-navy' : 'text-slate-400 group-hover:text-brand-gold'} />
                <span className="text-sm font-medium hidden md:block">{item.name}</span>
                {isActive && <ChevronRight size={14} className="ml-auto hidden md:block" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all group"
            suppressHydrationWarning
          >
            <LogOut size={20} />
            <span className="text-sm font-medium hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-200 bg-white/50 backdrop-blur-md flex items-center justify-between px-8 relative z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Ecosystem</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-tighter">System Administrator</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50"></div>
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
