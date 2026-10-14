import { useSovereignStore } from '@/store/SovereignContext';
import { NAV_ITEMS, type PageId } from '@/lib/constants';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard, Network, KeyRound, Scale, ShoppingCart,
  GitBranch, TrendingUp, Zap, FileCheck, Shield, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Network, KeyRound, Scale, ShoppingCart,
  GitBranch, TrendingUp, Zap, FileCheck,
};

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ currentPage, onNavigate, mobileOpen, onMobileClose }: SidebarProps) {
  const isTraining = useSovereignStore((s) => s.isTraining);
  const orgs = useSovereignStore((s) => s.orgs);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-secondary-950/60 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 flex flex-col z-50 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-secondary-200 dark:border-secondary-800 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-secondary-900 dark:text-secondary-50 tracking-tight">SOVEREIGN</h1>
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400 uppercase tracking-widest">Federated AI Grid</p>
          </div>
          <button
            className="lg:hidden text-secondary-400 hover:text-secondary-600"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onMobileClose();
                }}
                className={cn('nav-item w-full text-left', isActive ? 'nav-item-active' : 'nav-item-inactive')}
                role="navitem"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.id === 'federation' && isTraining && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="border-t border-secondary-200 dark:border-secondary-800 p-3 shrink-0">
          <div className="card p-3 bg-secondary-50 dark:bg-secondary-800/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400">Grid Status</span>
              <span className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold',
                isTraining ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-500'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isTraining ? 'bg-primary-500 animate-pulse' : 'bg-secondary-400'
                )} />
                {isTraining ? 'Training' : 'Idle'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
              <span>{orgs.length} organizations</span>
              <span>{orgs.filter((o) => o.status === 'active').length} active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
      onClick={onClick}
      aria-label="Open sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
